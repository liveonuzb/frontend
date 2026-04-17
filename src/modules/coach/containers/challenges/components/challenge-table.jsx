import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";

const ChallengeTable = ({ table, isLoading, filteredChallenges }) => {
  return (
    <DataGridContainer>
      <ScrollArea className="w-full">
        <DataGrid
          table={table}
          loadingMode="none"
          isLoading={isLoading}
          recordCount={filteredChallenges.length}
        >
          <DataGridTable />
        </DataGrid>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DataGridContainer>
  );
};

export default ChallengeTable;
