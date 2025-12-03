'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, RotateCcw } from 'lucide-react';

export interface AnalyticsFiltersState {
    channelId?: string;
    amazonTag?: string;
    category?: string;
    dealScoreMin?: number;
    dealScoreMax?: number;
}

interface Channel {
    id: string;
    name: string;
    platform: string;
}

interface AnalyticsFiltersProps {
    channels: Channel[];
    tags: string[];
    categories: string[];
    filters: AnalyticsFiltersState;
    onFilterChange: (filters: AnalyticsFiltersState) => void;
    loading?: boolean;
}

// Dropdown component
function Dropdown({
    label,
    value,
    options,
    onChange,
    placeholder = 'All'
}: {
    label: string;
    value?: string;
    options: { value: string; label: string }[];
    onChange: (value: string | undefined) => void;
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    value
                        ? 'bg-afflyt-cyan-500/20 border-afflyt-cyan-500/30 text-afflyt-cyan-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
            >
                <span className="text-xs text-gray-500">{label}:</span>
                <span className="font-medium truncate max-w-[100px]">
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-afflyt-dark-800 border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                    <button
                        onClick={() => {
                            onChange(undefined);
                            setIsOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                            !value ? 'text-afflyt-cyan-400' : 'text-gray-400'
                        }`}
                    >
                        {placeholder}
                    </button>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors truncate ${
                                value === option.value ? 'text-afflyt-cyan-400' : 'text-gray-300'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Range slider component for deal score
function RangeSlider({
    min,
    max,
    value,
    onChange
}: {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
}) {
    const [localMin, setLocalMin] = useState(value[0]);
    const [localMax, setLocalMax] = useState(value[1]);

    useEffect(() => {
        setLocalMin(value[0]);
        setLocalMax(value[1]);
    }, [value]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), localMax - 1);
        setLocalMin(newMin);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), localMin + 1);
        setLocalMax(newMax);
    };

    const handleMouseUp = () => {
        onChange([localMin, localMax]);
    };

    const isFiltered = localMin > min || localMax < max;

    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
            isFiltered
                ? 'bg-afflyt-cyan-500/20 border-afflyt-cyan-500/30'
                : 'bg-white/5 border-white/10'
        }`}>
            <span className="text-xs text-gray-500">Score:</span>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${isFiltered ? 'text-afflyt-cyan-400' : 'text-gray-400'}`}>
                    {localMin}
                </span>
                <div className="relative w-24 h-2">
                    <div className="absolute inset-0 bg-white/10 rounded-full" />
                    <div
                        className="absolute h-full bg-afflyt-cyan-500/50 rounded-full"
                        style={{
                            left: `${(localMin / max) * 100}%`,
                            right: `${100 - (localMax / max) * 100}%`
                        }}
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={localMin}
                        onChange={handleMinChange}
                        onMouseUp={handleMouseUp}
                        onTouchEnd={handleMouseUp}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={localMax}
                        onChange={handleMaxChange}
                        onMouseUp={handleMouseUp}
                        onTouchEnd={handleMouseUp}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                </div>
                <span className={`text-sm font-mono ${isFiltered ? 'text-afflyt-cyan-400' : 'text-gray-400'}`}>
                    {localMax}
                </span>
            </div>
        </div>
    );
}

export function AnalyticsFilters({
    channels,
    tags,
    categories,
    filters,
    onFilterChange,
    loading = false
}: AnalyticsFiltersProps) {
    const hasActiveFilters = !!(
        filters.channelId ||
        filters.amazonTag ||
        filters.category ||
        (filters.dealScoreMin !== undefined && filters.dealScoreMin > 0) ||
        (filters.dealScoreMax !== undefined && filters.dealScoreMax < 100)
    );

    const handleReset = () => {
        onFilterChange({
            channelId: undefined,
            amazonTag: undefined,
            category: undefined,
            dealScoreMin: undefined,
            dealScoreMax: undefined
        });
    };

    // Format channel options
    const channelOptions = channels.map(ch => ({
        value: ch.id,
        label: `${ch.name} (${ch.platform})`
    }));

    // Format tag options
    const tagOptions = tags.map(tag => ({
        value: tag,
        label: tag
    }));

    // Format category options
    const categoryOptions = categories.map(cat => ({
        value: cat,
        label: cat
    }));

    return (
        <div className={`flex flex-wrap items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Channel Filter */}
            {channelOptions.length > 0 && (
                <Dropdown
                    label="Channel"
                    value={filters.channelId}
                    options={channelOptions}
                    onChange={(value) => onFilterChange({ ...filters, channelId: value })}
                    placeholder="All Channels"
                />
            )}

            {/* Tag Filter */}
            {tagOptions.length > 0 && (
                <Dropdown
                    label="Tag"
                    value={filters.amazonTag}
                    options={tagOptions}
                    onChange={(value) => onFilterChange({ ...filters, amazonTag: value })}
                    placeholder="All Tags"
                />
            )}

            {/* Category Filter */}
            {categoryOptions.length > 0 && (
                <Dropdown
                    label="Category"
                    value={filters.category}
                    options={categoryOptions}
                    onChange={(value) => onFilterChange({ ...filters, category: value })}
                    placeholder="All Categories"
                />
            )}

            {/* Deal Score Range */}
            <RangeSlider
                min={0}
                max={100}
                value={[
                    filters.dealScoreMin ?? 0,
                    filters.dealScoreMax ?? 100
                ]}
                onChange={([min, max]) => onFilterChange({
                    ...filters,
                    dealScoreMin: min > 0 ? min : undefined,
                    dealScoreMax: max < 100 ? max : undefined
                })}
            />

            {/* Reset Button */}
            {hasActiveFilters && (
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                </button>
            )}

            {/* Active filters count */}
            {hasActiveFilters && (
                <span className="text-xs text-afflyt-cyan-400 bg-afflyt-cyan-500/10 px-2 py-1 rounded-full">
                    {[
                        filters.channelId,
                        filters.amazonTag,
                        filters.category,
                        (filters.dealScoreMin !== undefined && filters.dealScoreMin > 0) ||
                        (filters.dealScoreMax !== undefined && filters.dealScoreMax < 100)
                    ].filter(Boolean).length} active
                </span>
            )}
        </div>
    );
}
