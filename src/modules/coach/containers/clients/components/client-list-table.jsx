import React from "react";
import { isEmpty, size } from "lodash";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";

const ClientListTable = ({
  table,
  isLoading,
  filteredRows,
  onRowDoubleClick,
}) => {
  return (
    <DataGridContainer>
      <ScrollArea className="w-full">
        <DataGrid
          table={table}
          isLoading={isLoading}
          recordCount={size(filteredRows)}
          onRowDoubleClick={onRowDoubleClick}
        >
          <DataGridTable />
        </DataGrid>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DataGridContainer>
  );
};

export default ClientListTable;
