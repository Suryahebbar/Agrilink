#!/usr/bin/env python3
import argparse
import json
import sys
from crop_price_predictor import CropPricePredictor

def main():
    parser = argparse.ArgumentParser(description='Get historical crop prices')
    parser.add_argument('--crop', required=True, help='Crop name')
    parser.add_argument('--months', type=int, default=24, help='Months of historical data')
    parser.add_argument('--excel', default='AgriLink_Chikkamagaluru_Crop_Prices.xlsx', help='Excel file path')
    
    args = parser.parse_args()
    
    try:
        # Initialize predictor
        predictor = CropPricePredictor(args.excel)
        
        # Get historical data
        result = predictor.get_historical_data(args.crop, args.months)
        
        # Output as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {'error': str(e)}
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
