import pandas as pd
from typing import Dict, Any, List, Optional
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules
from app.core.database import OperationalSessionLocal
from app.models.operational import Encounter, Diagnosis, Treatment

def build_encounter_transactions() -> List[List[str]]:
    """
    Constructs discrete itemsets per encounter:
    Combines primary/secondary diagnoses and procedure names.
    """
    db = OperationalSessionLocal()
    try:
        from sqlalchemy import text
        query = text("""
            SELECT e.id, 'Diag: ' || d.diagnosis_category
            FROM encounters e
            JOIN diagnoses d ON d.encounter_id = e.id
            UNION ALL
            SELECT e.id, 'Proc: ' || t.procedure_name
            FROM encounters e
            JOIN treatments t ON t.encounter_id = e.id
        """)
        results = db.execute(query).fetchall()
        enc_map = {}
        for enc_id, item in results:
            enc_map.setdefault(enc_id, set()).add(item)
        return [list(items) for items in enc_map.values() if len(items) >= 2]
    finally:
        db.close()

def run_apriori_mining(min_support: float = 0.03, min_confidence: float = 0.25, min_lift: float = 1.0) -> Dict[str, Any]:
    """
    Executes Apriori Association Rule Mining using mlxtend.
    Returns frequent itemsets and ranked association rules.
    """
    transactions = build_encounter_transactions()
    total_encounters = len(transactions)
    if total_encounters < 10:
        return {
            "status": "error",
            "message": "Insufficient multi-item encounters to mine association rules.",
            "rules": []
        }
    
    # 1. One-hot encoding
    te = TransactionEncoder()
    te_ary = te.fit(transactions).transform(transactions)
    df = pd.DataFrame(te_ary, columns=te.columns_)
    
    # 2. Frequent Itemset Generation
    frequent_itemsets = apriori(df, min_support=min_support, use_colnames=True)
    if frequent_itemsets.empty:
        return {
            "status": "success",
            "min_support": min_support,
            "min_confidence": min_confidence,
            "total_encounters": total_encounters,
            "frequent_itemsets_count": 0,
            "rules": [],
            "message": "No itemsets met the minimum support threshold. Try lowering min_support."
        }
        
    frequent_itemsets["item_count"] = frequent_itemsets["itemsets"].apply(lambda x: len(x))
    
    # 3. Association Rules Generation
    rules_df = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)
    if rules_df.empty:
        return {
            "status": "success",
            "min_support": min_support,
            "min_confidence": min_confidence,
            "total_encounters": total_encounters,
            "frequent_itemsets_count": len(frequent_itemsets),
            "rules": [],
            "message": "Frequent itemsets discovered, but no rules met the minimum confidence threshold."
        }
        
    # Filter by min_lift and sort
    rules_df = rules_df[rules_df["lift"] >= min_lift]
    rules_df = rules_df.sort_values(by=["lift", "confidence"], ascending=[False, False])
    
    output_rules = []
    for idx, r in rules_df.head(50).iterrows():
        ant_list = list(r["antecedents"])
        con_list = list(r["consequents"])
        output_rules.append({
            "id": idx + 1,
            "antecedent": ", ".join(ant_list),
            "consequent": ", ".join(con_list),
            "support": round(float(r["support"]), 4),
            "confidence": round(float(r["confidence"]), 4),
            "lift": round(float(r["lift"]), 4),
            "supporting_encounters": int(round(r["support"] * total_encounters))
        })
        
    # Frequent itemsets summary (top 15)
    top_itemsets = []
    for _, row in frequent_itemsets.sort_values(by="support", ascending=False).head(15).iterrows():
        top_itemsets.append({
            "itemset": ", ".join(list(row["itemsets"])),
            "support": round(float(row["support"]), 4),
            "count": int(round(row["support"] * total_encounters))
        })

    return {
        "status": "success",
        "min_support": min_support,
        "min_confidence": min_confidence,
        "min_lift": min_lift,
        "total_encounters": total_encounters,
        "frequent_itemsets_count": len(frequent_itemsets),
        "rules_count": len(output_rules),
        "top_frequent_itemsets": top_itemsets,
        "rules": output_rules,
        "educational_note": "Apriori association rules measure statistical co-occurrence (e.g. diagnoses and diagnostic procedures frequently billed together). Lift > 1 indicates positive correlation; it does NOT imply medical etiology or treatment recommendations."
    }
