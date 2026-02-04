// Utility functions for exporting report data

// Convert data to CSV format
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[]
): string {
  if (!data || data.length === 0) return "";

  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  // Convert each data object to a CSV row
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}

// Export data as CSV file
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export data as JSON file
export function exportToJSON<T>(data: T, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export chart data as image (simplified version)
export function exportChartAsImage(
  chartRef: HTMLElement,
  filename: string
): void {
  // This is a placeholder - in a real implementation, you would use
  // a library like html2canvas to convert the chart to an image
  console.log("Exporting chart as image:", chartRef, filename);

  // Example implementation with html2canvas (would need to install the library):
  // html2canvas(chartRef).then(canvas => {
  //   const link = document.createElement('a');
  //   link.download = `${filename}.png`;
  //   link.href = canvas.toDataURL('image/png');
  //   link.click();
  // });
}
