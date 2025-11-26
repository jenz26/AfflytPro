'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { API_BASE } from '@/lib/api/config';

interface ExportDropdownProps {
    period: string;
}

export function ExportDropdown({ period }: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const exportCSV = async () => {
        setExporting('csv');
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_BASE}/analytics/export?period=${period}&format=csv`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `afflyt-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('CSV export failed:', err);
        } finally {
            setExporting(null);
            setIsOpen(false);
        }
    };

    const exportPDF = async () => {
        setExporting('pdf');
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch summary data for PDF
            const res = await fetch(`${API_BASE}/analytics/export/summary?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Export failed');

            const data = await res.json();

            // Generate PDF using browser print (simple approach)
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Please allow popups to generate PDF');
                return;
            }

            const html = generatePDFHTML(data);
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.print();
            };
        } catch (err) {
            console.error('PDF export failed:', err);
        } finally {
            setExporting(null);
            setIsOpen(false);
        }
    };

    const generatePDFHTML = (data: any) => `
<!DOCTYPE html>
<html>
<head>
    <title>Afflyt Analytics Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #06b6d4; }
        .logo { font-size: 28px; font-weight: bold; color: #06b6d4; margin-bottom: 8px; }
        .subtitle { color: #666; font-size: 14px; }
        .period { background: #f0f9ff; padding: 12px 20px; border-radius: 8px; display: inline-block; margin-top: 16px; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .kpi-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .kpi-value { font-size: 28px; font-weight: bold; color: #06b6d4; }
        .kpi-value.green { color: #10b981; }
        .kpi-label { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-change { font-size: 12px; margin-top: 8px; }
        .kpi-change.up { color: #10b981; }
        .kpi-change.down { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
        th { background: #f8fafc; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666; }
        td { font-size: 14px; }
        .revenue { color: #10b981; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #999; font-size: 12px; }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Afflyt</div>
        <div class="subtitle">Analytics Report</div>
        <div class="period">
            ${data.period.startDate} to ${data.period.endDate} (${data.period.days} days)
        </div>
    </div>

    <div class="section">
        <div class="section-title">Performance Summary</div>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value green">€${data.summary.totalRevenue.toFixed(2)}</div>
                <div class="kpi-label">Total Revenue</div>
                <div class="kpi-change ${data.trends.revenueChange >= 0 ? 'up' : 'down'}">
                    ${data.trends.revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(data.trends.revenueChange)}% vs previous period
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.summary.totalClicks.toLocaleString()}</div>
                <div class="kpi-label">Total Clicks</div>
                <div class="kpi-change ${data.trends.clicksChange >= 0 ? 'up' : 'down'}">
                    ${data.trends.clicksChange >= 0 ? '↑' : '↓'} ${Math.abs(data.trends.clicksChange)}% vs previous period
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.summary.totalConversions}</div>
                <div class="kpi-label">Conversions</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.summary.cvr}%</div>
                <div class="kpi-label">Conversion Rate</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">€${data.summary.epc.toFixed(2)}</div>
                <div class="kpi-label">Earnings Per Click</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.summary.totalLinks}</div>
                <div class="kpi-label">Active Links</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Top Performing Products</div>
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Clicks</th>
                    <th>Conversions</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${data.topLinks.map((link: any) => `
                    <tr>
                        <td>${link.title}</td>
                        <td>${link.clicks}</td>
                        <td>${link.conversions}</td>
                        <td class="revenue">€${link.revenue.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Revenue by Category</div>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Clicks</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${data.categories.map((cat: any) => `
                    <tr>
                        <td>${cat.name}</td>
                        <td>${cat.clicks}</td>
                        <td class="revenue">€${cat.revenue.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Afflyt - Affiliate Marketing Intelligence</p>
    </div>
</body>
</html>
    `;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
                <Download className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Export</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-afflyt-dark-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                        onClick={exportCSV}
                        disabled={exporting !== null}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        {exporting === 'csv' ? (
                            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        )}
                        <div className="text-left">
                            <p className="text-white text-sm font-medium">Export CSV</p>
                            <p className="text-gray-500 text-xs">Download spreadsheet</p>
                        </div>
                    </button>
                    <button
                        onClick={exportPDF}
                        disabled={exporting !== null}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-t border-white/5 disabled:opacity-50"
                    >
                        {exporting === 'pdf' ? (
                            <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4 text-red-400" />
                        )}
                        <div className="text-left">
                            <p className="text-white text-sm font-medium">Export PDF</p>
                            <p className="text-gray-500 text-xs">Generate report</p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
