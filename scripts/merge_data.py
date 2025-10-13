#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
失智症評估資料合併與報表生成腳本
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

def flatten_data(data_list):
    """將嵌套的 JSON 資料扁平化為表格"""
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

def generate_summary_statistics(df):
    """生成摘要統計"""
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
        print(f"⚠️  生成摘要統計時發生錯誤: {e}")
    
    return summary

def create_pivot_tables(df):
    """創建樞紐分析表"""
    pivot_tables = {}
    
    try:
        # 性別與風險等級交叉表
        if '性別' in df.columns and '整體風險' in df.columns:
            pivot_tables['性別_風險交叉表'] = pd.crosstab(
                df['性別'], 
                df['整體風險'], 
                margins=True, 
                margins_name='總計'
            )
        
        # 年齡組與失智症類型交叉表
        if '年齡' in df.columns and '最可能類型' in df.columns:
            df_copy = df.copy()
            df_copy['年齡組'] = pd.cut(
                pd.to_numeric(df_copy['年齡'], errors='coerce'), 
                bins=[0, 60, 70, 80, 120], 
                labels=['<60', '60-69', '70-79', '80+']
            )
            pivot_tables['年齡組_類型交叉表'] = pd.crosstab(
                df_copy['年齡組'], 
                df_copy['最可能類型'], 
                margins=True, 
                margins_name='總計'
            )
        
        # 教育程度與風險等級交叉表
        if '教育程度' in df.columns and '整體風險' in df.columns:
            pivot_tables['教育程度_風險交叉表'] = pd.crosstab(
                df['教育程度'], 
                df['整體風險'], 
                margins=True, 
                margins_name='總計'
            )
    
    except Exception as e:
        print(f"⚠️  創建樞紐表時發生錯誤: {e}")
    
    return pivot_tables

def main():
    print("=" * 60)
    print("🚀 失智症評估資料處理系統")
    print("=" * 60)
    
    # 載入所有資料
    all_data = load_all_json_files('data')
    
    if len(all_data) == 0:
        print("\n⚠️  沒有找到任何評估資料")
        print("💡 請確認 data/ 資料夾中有 JSON 檔案")
        return
    
    print(f"\n✅ 成功載入 {len(all_data)} 個評估檔案")
    
    # 扁平化資料
    print("\n🔄 正在處理資料...")
    df = flatten_data(all_data)
    print(f"✅ 資料處理完成，共 {len(df)} 筆記錄，{len(df.columns)} 個欄位")
    
    # 確保 reports 目錄存在
    reports_path = Path('reports')
    reports_path.mkdir(exist_ok=True)
    
    # 生成時間戳記
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 儲存為 CSV（含時間戳記）
    print("\n📄 生成 CSV 報表...")
    csv_path = f'reports/all_assessments_{timestamp}.csv'
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"  ✅ {csv_path}")
    
    # 儲存為 Excel（含時間戳記）
    print("\n📊 生成 Excel 報表...")
    excel_path = f'reports/all_assessments_{timestamp}.xlsx'
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # 完整資料
        df.to_excel(writer, sheet_name='完整資料', index=False)
        print("  ✅ 工作表: 完整資料")
        
        # 摘要統計
        summary = generate_summary_statistics(df)
        if summary:
            summary_df = pd.DataFrame([summary]).T
            summary_df.columns = ['數值']
            summary_df.to_excel(writer, sheet_name='摘要統計')
            print("  ✅ 工作表: 摘要統計")
        
        # 風險分布
        if '整體風險' in df.columns:
            risk_dist = df['整體風險'].value_counts().reset_index()
            risk_dist.columns = ['風險等級', '個案數']
            risk_dist['百分比'] = (risk_dist['個案數'] / len(df) * 100).round(2)
            risk_dist.to_excel(writer, sheet_name='風險分布', index=False)
            print("  ✅ 工作表: 風險分布")
        
        # 失智症類型分布
        if '最可能類型' in df.columns:
            type_dist = df['最可能類型'].value_counts().reset_index()
            type_dist.columns = ['失智症類型', '個案數']
            type_dist['百分比'] = (type_dist['個案數'] / len(df) * 100).round(2)
            type_dist.to_excel(writer, sheet_name='類型分布', index=False)
            print("  ✅ 工作表: 類型分布")
        
        # 樞紐分析表
        pivot_tables = create_pivot_tables(df)
        for name, pivot_df in pivot_tables.items():
            pivot_df.to_excel(writer, sheet_name=name)
            print(f"  ✅ 工作表: {name}")
    
    print(f"\n✅ Excel 報表已生成: {excel_path}")
    
    # 生成最新版本（不含時間戳記，用於持續更新）
    print("\n📌 生成最新版本...")
    df.to_csv('reports/all_assessments_latest.csv', index=False, encoding='utf-8-sig')
    
    with pd.ExcelWriter('reports/all_assessments_latest.xlsx', engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='完整資料', index=False)
        
        if summary:
            summary_df = pd.DataFrame([summary]).T
            summary_df.columns = ['數值']
            summary_df.to_excel(writer, sheet_name='摘要統計')
        
        if '整體風險' in df.columns:
            risk_dist = df['整體風險'].value_counts().reset_index()
            risk_dist.columns = ['風險等級', '個案數']
            risk_dist['百分比'] = (risk_dist['個案數'] / len(df) * 100).round(2)
            risk_dist.to_excel(writer, sheet_name='風險分布', index=False)
        
        if '最可能類型' in df.columns:
            type_dist = df['最可能類型'].value_counts().reset_index()
            type_dist.columns = ['失智症類型', '個案數']
            type_dist['百分比'] = (type_dist['個案數'] / len(df) * 100).round(2)
            type_dist.to_excel(writer, sheet_name='類型分布', index=False)
        
        for name, pivot_df in pivot_tables.items():
            pivot_df.to_excel(writer, sheet_name=name)
    
    print("  ✅ all_assessments_latest.csv")
    print("  ✅ all_assessments_latest.xlsx")
    
    print("\n" + "=" * 60)
    print("✨ 處理完成！")
    print(f"📊 共處理 {len(all_data)} 個評估檔案")
    print(f"📁 報表位置: reports/")
    print("=" * 60)

if __name__ == '__main__':
    main()