#!/usr/bin/env python3
import argparse
import json
import sys
from crop_price_predictor import CropPricePredictor

def main():
    parser = argparse.ArgumentParser(description='Get available crops')
    parser.add_argument('--excel', default='AgriLink_Chikkamagaluru_Crop_Prices.xlsx', help='Excel file path')
    
    args = parser.parse_args()
    
    try:
        # Initialize predictor
        predictor = CropPricePredictor(args.excel)
        
        # Get crop list
        crops = predictor.get_crop_list()
        
        # Format crop names
        formatted_crops = []
        for crop in crops:
            formatted_crops.append({
                'value': crop,
                'label': crop.title()
            })
        
        result = {
            'crops': formatted_crops,
            'total': len(formatted_crops)
        }
        
        # Output as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {'error': str(e)}
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
