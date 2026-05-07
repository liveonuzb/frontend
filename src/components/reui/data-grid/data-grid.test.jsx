/* eslint-disable react-hooks/incompatible-library */
import React from "react";
import { render, screen } from "@testing-library/react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid, DataGridContainer } from "./data-grid.jsx";
import { DataGridTable } from "./data-grid-table.jsx";

const localStorageMock = {
  data: new Map(),
  getItem: vi.fn((key) => localStorageMock.data.get(key) ?? null),
  setItem: vi.fn((key, value) => {
    localStorageMock.data.set(key, String(value));
  }),
  removeItem: vi.fn((key) => {
    localStorageMock.data.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageMock.data.clear();
  }),
};

const TestGrid = ({ data = [] }) => {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
        meta: { headerTitle: "Name" },
      },
    ],
    [],
  );
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataGrid table={table} recordCount={data.length} storageKey="test-grid">
      <DataGridContainer>
        <DataGridTable />
      </DataGridContainer>
    </DataGrid>
  );
};

describe("DataGrid", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
    window.history.pushState(null, "", "/");
  });

  it("shows coach grid toolbar with saved views and column visibility", () => {
    window.history.pushState(null, "", "/coach/payments");

    render(<TestGrid data={[{ name: "Ali" }, { name: "Vali" }]} />);

    expect(screen.getByText("2 ta yozuv")).toBeInTheDocument();
    expect(screen.getByText("Viewlar")).toBeInTheDocument();
    expect(screen.getByText("Ustunlar")).toBeInTheDocument();
    expect(screen.getByText("Ali")).toBeInTheDocument();
  });

  it("shows a clear empty state", () => {
    window.history.pushState(null, "", "/coach/payments");

    render(<TestGrid data={[]} />);

    expect(screen.getByText("Ma'lumot topilmadi")).toBeInTheDocument();
    expect(
      screen.getByText("Filterlarni o'zgartiring yoki yangi yozuv yarating."),
    ).toBeInTheDocument();
  });
});
