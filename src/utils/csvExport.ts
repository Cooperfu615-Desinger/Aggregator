/**
 * Export JSON data to CSV and trigger download
 * @param data Array of objects to export
 * @param filename Desired filename (without extension)
 * @param headers Mapping of data keys to CSV column headers
 */
export function exportToCSV(data: any[], filename: string, headers: Record<string, string>) {
    if (!data || !data.length) return;

    const headerKeys = Object.keys(headers);
    const headerLabels = Object.values(headers);

    const csvRows = [
        headerLabels.join(','), // Header row
        ...data.map(row =>
            headerKeys.map(key => {
                let val = row[key];

                // Handle null/undefined
                if (val === undefined || val === null) {
                    val = '';
                }

                // Handle strings that might contain commas or quotes
                const stringVal = String(val);
                if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            }).join(',')
        )
    ];

    const csvContent = csvRows.join('\n');

    // Add BOM (\ufeff) for Excel encoding compatibility (especially for UTF-8 Chinese characters)
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
