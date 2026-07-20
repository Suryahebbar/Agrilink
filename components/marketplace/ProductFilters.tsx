"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Star } from 'lucide-react';

interface ProductFiltersProps {
  categories: string[];
  priceRange: [number, number];
  onFilterChange: (filters: {
    priceRange: [number, number];
    categories: string[];
    minRating: number;
  }) => void;
}

export default function ProductFilters({ 
  categories, 
  priceRange: initialPriceRange, 
  onFilterChange 
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);

  // Update parent when filters change
  const prevFiltersRef = useRef<{
    priceRange: [number, number];
    categories: string[];
    minRating: number;
  } | null>(null);

  useEffect(() => {
    const newFilters = {
      priceRange,
      categories: selectedCategories,
      minRating: rating
    };

    // Only update if filters have actually changed
    if (
      !prevFiltersRef.current ||
      prevFiltersRef.current.priceRange[0] !== priceRange[0] ||
      prevFiltersRef.current.priceRange[1] !== priceRange[1] ||
      prevFiltersRef.current.categories.length !== selectedCategories.length ||
      !prevFiltersRef.current.categories.every((c: string, i: number) => c === selectedCategories[i]) ||
      prevFiltersRef.current.minRating !== rating
    ) {
      const timer = setTimeout(() => {
        onFilterChange(newFilters);
        prevFiltersRef.current = newFilters;
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [priceRange, selectedCategories, rating, onFilterChange]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePriceChange = (value: number[]) => {
    // Only update if the value has actually changed
    if (priceRange[0] !== value[0] || priceRange[1] !== value[1]) {
      setPriceRange([value[0], value[1]] as [number, number]);
    }
  };

  const handleRatingChange = (selectedRating: number) => {
    setRating(selectedRating === rating ? 0 : selectedRating);
  };

  // Memoize the slider to prevent unnecessary re-renders
  const priceSlider = useMemo(() => (
    <Slider
      key={`slider-${initialPriceRange[0]}-${initialPriceRange[1]}`}
      value={[priceRange[0], priceRange[1]]}
      max={initialPriceRange[1]}
      min={initialPriceRange[0]}
      step={100}
      onValueChange={handlePriceChange}
      className="mb-4"
    />
  ), [priceRange[0], priceRange[1], initialPriceRange[0], initialPriceRange[1]]);

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-white">
      <div>
        <h3 className="font-medium mb-4">Price Range</h3>
        <div className="px-2">
          {priceSlider}
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox 
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryChange(category)}
              />
              <label
                htmlFor={category}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Customer Review</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((star) => (
            <div 
              key={star} 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => handleRatingChange(star)}
            >
              <div className={`flex ${rating === star ? 'text-yellow-500' : 'text-gray-300'}`}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < star ? 'fill-current' : ''}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">& Up</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => {
          setPriceRange(initialPriceRange);
          setSelectedCategories([]);
          setRating(0);
        }}
        className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
      >
        Clear all filters
      </button>
    </div>
  );
}
