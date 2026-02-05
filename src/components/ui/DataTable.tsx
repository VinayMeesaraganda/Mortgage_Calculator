import React from 'react';

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({ headers, children }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-100">
          <tr>
            {headers.map((header) => (
              <th key={header} className="text-left p-3 font-semibold text-slate-600">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export default DataTable;
