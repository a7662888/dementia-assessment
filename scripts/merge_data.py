#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
失智症評估資料合併與報表生成腳本 (問卷與 MoCA-T 雙軌整合版)
Dementia Assessment Data Merger and Report Generator
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime

def load_all_json_files(data_dir='data'):
    """載入所有 JSON 檔案"""
    data_path = Path(data_dir)
    all_data = []
    
    if not data_path.exists():
        print(f"⚠️  資料夾 {data_dir} 不存在")
        return all_data
    
    json_files = list(data_path.glob('*.json'))
    print(f"🔍 搜尋到 {len(json_files)} 個 JSON 檔案")
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                data['_filename'] = json_file.name
                all_data.append(data)
                print(f"  ✅ 成功載入: {json_file.name}")
        except Exception as e:
            print(f"  ⚠️  無法讀取 {json_file.name}: {e}")
    
    return all_data

def is_moca_file(data):
    """判斷是否為 MoCA-T 檔案"""
    return (
        "MoCA" in data.get('tool', '') or 
        "MoCA" in data.get('metadata', {}).get('toolVersion', '') or
        "drawings" in data or
        ("scores" in data and "trail" in data.get("scores", {}))
    )

def flatten_questionnaire(data_list):
    """將結構問卷資料扁平化"""
    rows = []
    for data in data_list:
        row = {
            # 檔案資訊
            '檔案名稱': data.get('_filename', ''),
            '匯出時間': data.get('metadata', {}).get('exportDate', ''),
            '工具版本': data.get('metadata', {}).get('toolVersion', ''),
            
            # 基本資料
            '病患姓名': data.get('patientInfo', {}).get('name', ''),
            '病歷號': data.get('patientInfo', {}).get('chartNumber', ''),
            '出生日期': data.get('patientInfo', {}).get('birthDate', ''),
            '年齡': data.get('patientInfo', {}).get('age', ''),
            '性別': data.get('patientInfo', {}).get('gender', ''),
            '教育程度': data.get('patientInfo', {}).get('education', ''),
            '評估日期': data.get('patientInfo', {}).get('assessmentDate', ''),
            '資訊提供者': data.get('patientInfo', {}).get('informantName', ''),
            '與患者關係': data.get('patientInfo', {}).get('informantRelation', ''),
            
            # 評估結果
            '整體風險': data.get('results', {}).get('overallRisk', ''),
            'ADL障礙程度': round(data.get('results', {}).get('adlImpairment', 0), 2),
            
            # 各類型失智症百分比
            'AD百分比': round(data.get('results', {}).get('percentages', {}).get('AD', 0), 2),
            'DLB百分比': round(data.get('results', {}).get('percentages', {}).get('DLB', 0), 2),
            'VaD百分比': round(data.get('results', {}).get('percentages', {}).get('VaD', 0), 2),
            'FTD百分比': round(data.get('results', {}).get('percentages', {}).get('FTD', 0), 2),
            'PPA百分比': round(data.get('results', {}).get('percentages', {}).get('PPA', 0), 2),
            
            # 相對機率
            'AD相對機率': round(data.get('results', {}).get('probabilities', {}).get('AD', 0), 2),
            'DLB相對機率': round(data.get('results', {}).get('probabilities', {}).get('DLB', 0), 2),
            'VaD相對機率': round(data.get('results', {}).get('probabilities', {}).get('VaD', 0), 2),
            'FTD相對機率': round(data.get('results', {}).get('probabilities', {}).get('FTD', 0), 2),
            'PPA相對機率': round(data.get('results', {}).get('probabilities', {}).get('PPA', 0), 2),
            
            # 最可能的失智症類型
            '最可能類型': '',
            '最高機率值': 0,
            
            # 異常症狀數量
            '異常症狀數': len(data.get('abnormalSymptoms', [])),
            
            # 臨床建議數量
            '臨床建議數': len(data.get('recommendations', []))
        }
        
        # 判斷最可能的失智症類型
        probs = data.get('results', {}).get('probabilities', {})
        if probs:
            max_type = max(probs, key=probs.get)
            max_prob = probs[max_type]
            row['最可能類型'] = max_type
            row['最高機率值'] = round(max_prob, 2)
        
        # 加入所有問題回答
        responses = data.get('responses', {})
        for key, value in responses.items():
            row[f'回答_{key}'] = value
        
        rows.append(row)
    return pd.DataFrame(rows)

def flatten_moca(data_list):
    """將 MoCA-T 資料扁平化"""
    rows = []
    for data in data_list:
        p_info = data.get('patientInfo', {})
        demo = data.get('demo', {})
        
        name = p_info.get('name') or demo.get('name') or ''
        chart = p_info.get('chartNumber') or demo.get('chartNumber') or ''
        age = p_info.get('age') or demo.get('age') or ''
        sex = p_info.get('gender') or ("男" if demo.get('sex') == "1" else "女" if demo.get('sex') == "0" else "") or ''
        edu = p_info.get('education') or demo.get('edu') or ''
        date = p_info.get('assessmentDate') or data.get('time', '')[:10] or ''

        row = {
            '檔案名稱': data.get('_filename', ''),
            '匯出時間': data.get('metadata', {}).get('exportDate') or data.get('time', ''),
            '工具版本': data.get('metadata', {}).get('toolVersion') or data.get('tool', ''),
            
            # 基本資料
            '病患姓名': name,
            '病歷號': chart,
            '年齡': age,
            '性別': sex,
            '教育程度(年數)': edu,
            '評估日期': date,
            
            # 評估總體分數
            '原始總分': data.get('results', {}).get('totalScore') or data.get('total', 0),
            '教育加分': data.get('results', {}).get('educationBonus', 0),
            '常模校正總分(Adj)': data.get('results', {}).get('adjTotalScore', 0),
            '百分等級(PR)': data.get('results', {}).get('totalPR', ''),
            'z分數': data.get('results', {}).get('totalZ', ''),
            
            # 認知領域得分
            '領域_視覺空間原始': data.get('domains', {}).get('vs', 0),
            '領域_命名原始': data.get('domains', {}).get('naming', 0),
            '領域_專注力原始': data.get('domains', {}).get('attention', 0),
            '領域_語言原始': data.get('domains', {}).get('language', 0),
            '領域_抽象原始': data.get('domains', {}).get('abstract', 0),
            '領域_延遲記憶原始': data.get('domains', {}).get('memory', 0),
            '領域_定向原始': data.get('domains', {}).get('orientation', 0),
        }
        
        # 加上詳細評估分數的校正值
        domain_results = data.get('results', {}).get('domainResults', {})
        if domain_results:
            for k in ["vs", "naming", "attention", "language", "abstract", "memory", "orientation"]:
                dom = domain_results.get(k, {})
                if dom:
                    row[f'領域_{k}_Adj'] = round(dom.get('adj', 0), 2) if dom.get('adj') is not None else ''
                    row[f'領域_{k}_PR'] = dom.get('pr', '')
                    row[f'領域_{k}_z'] = round(dom.get('z', 0), 2) if dom.get('z') is not None else ''

        # 加上每題作答得分
        scores = data.get('scores', {})
        for key, value in scores.items():
            row[f'得分_{key}'] = value
            
        rows.append(row)
    return pd.DataFrame(rows)

def generate_summary_statistics(df):
    """生成結構問卷的摘要統計"""
    summary = {}
    try:
        summary['總個案數'] = len(df)
        if '評估日期' in df.columns and len(df) > 0:
            dates = pd.to_datetime(df['評估日期'], errors='coerce')
            valid_dates = dates.dropna()
            if len(valid_dates) > 0:
                summary['最早評估日期'] = valid_dates.min().strftime('%Y-%m-%d')
                summary['最晚評估日期'] = valid_dates.max().strftime('%Y-%m-%d')
        
        if '年齡' in df.columns:
            ages = pd.to_numeric(df['年齡'], errors='coerce')
            valid_ages = ages.dropna()
            if len(valid_ages) > 0:
                summary['平均年齡'] = round(valid_ages.mean(), 1)
                summary['年齡中位數'] = valid_ages.median()
                summary['最小年齡'] = valid_ages.min()
                summary['最大年齡'] = valid_ages.max()
        
        if '性別' in df.columns:
            gender_counts = df['性別'].value_counts()
            for gender, count in gender_counts.items():
                summary[f'性別_{gender}'] = count
        
        if '整體風險' in df.columns:
            risk_counts = df['整體風險'].value_counts()
            for risk, count in risk_counts.items():
                summary[f'風險_{risk}'] = count
        
        if 'ADL障礙程度' in df.columns:
            adl = pd.to_numeric(df['ADL障礙程度'], errors='coerce')
            valid_adl = adl.dropna()
            if len(valid_adl) > 0:
                summary['平均ADL障礙程度'] = round(valid_adl.mean(), 2)
        
        if '最可能類型' in df.columns:
            type_counts = df['最可能類型'].value_counts()
            for dtype, count in type_counts.items():
                summary[f'類型_{dtype}'] = count
    except Exception as e:
        print(f"⚠️  生成問卷摘要統計時發生錯誤: {e}")
    return summary

def generate_moca_summary_statistics(df):
    """生成 MoCA-T 的摘要統計"""
    summary = {}
    try:
        summary['總個案數'] = len(df)
        if '評估日期' in df.columns and len(df) > 0:
            dates = pd.to_datetime(df['評估日期'], errors='coerce')
            valid_dates = dates.dropna()
            if len(valid_dates) > 0:
                summary['最早評估日期'] = valid_dates.min().strftime('%Y-%m-%d')
                summary['最晚評估日期'] = valid_dates.max().strftime('%Y-%m-%d')
        
        if '年齡' in df.columns:
            ages = pd.to_numeric(df['年齡'], errors='coerce')
            valid_ages = ages.dropna()
            if len(valid_ages) > 0:
                summary['平均年齡'] = round(valid_ages.mean(), 1)
        
        if '原始總分' in df.columns:
            scores = pd.to_numeric(df['原始總分'], errors='coerce')
            valid_scores = scores.dropna()
            if len(valid_scores) > 0:
                summary['平均原始總分'] = round(valid_scores.mean(), 1)
                summary['原始總分中位數'] = valid_scores.median()
                summary['最小原始總分'] = valid_scores.min()
                summary['最大原始總分'] = valid_scores.max()
                
        if '常模校正總分(Adj)' in df.columns:
            adj_scores = pd.to_numeric(df['常模校正總分(Adj)'], errors='coerce')
            valid_adj = adj_scores.dropna()
            if len(valid_adj) > 0:
                summary['平均校正總分(Adj)'] = round(valid_adj.mean(), 1)
    except Exception as e:
        print(f"⚠️  生成 MoCA 摘要統計時發生錯誤: {e}")
    return summary

def create_pivot_tables(df):
    """創建問卷的樞紐分析表"""
    pivot_tables = {}
    try:
        if '性別' in df.columns and '整體風險' in df.columns:
            pivot_tables['性別_風險交叉表'] = pd.crosstab(
                df['性別'], df['整體風險'], margins=True, margins_name='總計'
            )
        
        if '年齡' in df.columns and '最可能類型' in df.columns:
            df_copy = df.copy()
            df_copy['年齡組'] = pd.cut(
                pd.to_numeric(df_copy['年齡'], errors='coerce'), 
                bins=[0, 60, 70, 80, 120], 
                labels=['<60', '60-69', '70-79', '80+']
            )
            pivot_tables['年齡組_類型交叉表'] = pd.crosstab(
                df_copy['年齡組'], df_copy['最可能類型'], margins=True, margins_name='總計'
            )
    except Exception as e:
        print(f"⚠️  創建樞紐表時發生錯誤: {e}")
    return pivot_tables

def main():
    print("=" * 60)
    print("🚀 失智症評估資料雙軌合併系統 (問卷 & MoCA-T)")
    print("=" * 60)
    
    # 載入所有資料
    all_data = load_all_json_files('data')
    
    if len(all_data) == 0:
        print("\n⚠️  沒有找到任何評估資料")
        print("💡 請確認 data/ 資料夾中有 JSON 檔案")
        return
    
    # 分流資料
    moca_data = [d for d in all_data if is_moca_file(d)]
    q_data = [d for d in all_data if not is_moca_file(d)]
    
    print(f"\n📊 分流結果:")
    print(f"  - 結構問卷檔案: {len(q_data)} 個")
    print(f"  - MoCA-T 評估檔案: {len(moca_data)} 個")
    
    # 轉換為 DataFrame
    df_q = flatten_questionnaire(q_data) if q_data else pd.DataFrame()
    df_moca = flatten_moca(moca_data) if moca_data else pd.DataFrame()
    
    # 確保 reports 目錄存在
    reports_path = Path('reports')
    reports_path.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    excel_path = f'reports/all_assessments_{timestamp}.xlsx'
    
    print("\n📊 開始寫入 Excel 報表...")
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # 1. 寫入結構問卷資料
        if not df_q.empty:
            df_q.to_excel(writer, sheet_name='結構問卷資料', index=False)
            print("  ✅ 寫入工作表: 結構問卷資料")
            
            summary_q = generate_summary_statistics(df_q)
            if summary_q:
                pd.DataFrame([summary_q]).T.to_excel(writer, sheet_name='問卷摘要統計')
                print("  ✅ 寫入工作表: 問卷摘要統計")
                
            pivot_q = create_pivot_tables(df_q)
            for name, p_df in pivot_q.items():
                p_df.to_excel(writer, sheet_name=f'問卷_{name}')
                print(f"  ✅ 寫入工作表: 問卷_{name}")
        
        # 2. 寫入 MoCA-T 資料
        if not df_moca.empty:
            df_moca.to_excel(writer, sheet_name='MoCA-T評估資料', index=False)
            print("  ✅ 寫入工作表: MoCA-T評估資料")
            
            summary_m = generate_moca_summary_statistics(df_moca)
            if summary_m:
                pd.DataFrame([summary_m]).T.to_excel(writer, sheet_name='MoCA-T摘要統計')
                print("  ✅ 寫入工作表: MoCA-T摘要統計")

    print(f"\n💾 Excel 報表已生成: {excel_path}")
    
    # 生成 latest 持續更新版本 (同時更新 xlsx 與 csv)
    latest_xlsx = 'reports/all_assessments_latest.xlsx'
    with pd.ExcelWriter(latest_xlsx, engine='openpyxl') as writer:
        if not df_q.empty:
            df_q.to_excel(writer, sheet_name='結構問卷資料', index=False)
            summary_q = generate_summary_statistics(df_q)
            if summary_q:
                pd.DataFrame([summary_q]).T.to_excel(writer, sheet_name='問卷摘要統計')
            pivot_q = create_pivot_tables(df_q)
            for name, p_df in pivot_q.items():
                p_df.to_excel(writer, sheet_name=f'問卷_{name}')
                
        if not df_moca.empty:
            df_moca.to_excel(writer, sheet_name='MoCA-T評估資料', index=False)
            summary_m = generate_moca_summary_statistics(df_moca)
            if summary_m:
                pd.DataFrame([summary_m]).T.to_excel(writer, sheet_name='MoCA-T摘要統計')
                
    print(f"📌 更新最新 Excel 入口: {latest_xlsx}")
    
    # 輸出各自的最新版 CSV 以利文字備份
    if not df_q.empty:
        df_q.to_csv('reports/all_assessments_latest.csv', index=False, encoding='utf-8-sig')
        print("  ✅ 更新: reports/all_assessments_latest.csv")
    if not df_moca.empty:
        df_moca.to_csv('reports/moca_assessments_latest.csv', index=False, encoding='utf-8-sig')
        print("  ✅ 更新: reports/moca_assessments_latest.csv")
        
    print("\n" + "=" * 60)
    print("✨ 處理完成！")
    print(f"📊 總處理量: {len(all_data)} 筆 JSON 個案")
    print("=" * 60)

if __name__ == '__main__':
    main()