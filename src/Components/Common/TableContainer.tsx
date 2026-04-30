import React, { Fragment, useEffect, useState } from "react";
import { CardBody, Col, Row, Table } from "reactstrap";
import { Link } from "react-router-dom";

import {
  Column,
  Table as ReactTable,
  ColumnFiltersState,
  FilterFn,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';

import { rankItem } from '@tanstack/match-sorter-utils';

import {
  ProductsGlobalFilter,
  CustomersGlobalFilter,
  OrderGlobalFilter,
  ContactsGlobalFilter,
  CompaniesGlobalFilter,
  LeadsGlobalFilter,
  CryptoOrdersGlobalFilter,
  InvoiceListGlobalSearch,
  TicketsListGlobalFilter,
  NFTRankingGlobalFilter,
  TaskListGlobalFilter,
} from "../../Components/Common/GlobalSearchFilter";

// Column Filter
const Filter = ({
  column
}: {
  column: Column<any, unknown>;
  table: ReactTable<any>;
}) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? '') as string}
        onChange={value => column.setFilterValue(value)}
        placeholder="Search..."
        className="w-36 border shadow rounded"
        list={column.id + 'list'}
      />
      <div className="h-1" />
    </>
  );
};

// Global Filter
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, onChange, value]);

  return (
    <input {...props} value={value} id="search-bar-0" className="form-control search" onChange={e => setValue(e.target.value)} />
  );
};

interface TableContainerProps {
  columns?: any;
  data?: any;
  isGlobalFilter?: any;
  isProductsFilter?: any;
  isCustomerFilter?: any;
  isOrderFilter?: any;
  isContactsFilter?: any;
  isCompaniesFilter?: any;
  isLeadsFilter?: any;
  iscustomPageSize?: any;
  isBordered?: any;
  isCryptoOrdersFilter?: any;
  isInvoiceListFilter?: any;
  isTicketsListFilter?: any;
  isNFTRankingFilter?: any;
  isTaskListFilter?: any;
  handleTaskClick?: any;
  customPageSize?: any;
  tableClass?: any;
  theadClass?: any;
  trClass?: any;
  thClass?: any;
  divClass?: any;
  SearchPlaceholder?: any;
  handleContactClick?: any;
  handleTicketClick?: any;
  isPagination?: boolean;
  totalDataCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  currentPage?: number;
}

const TableContainer = ({
  columns,
  data,
  isGlobalFilter,
  isProductsFilter,
  isCustomerFilter,
  isOrderFilter,
  isContactsFilter,
  isCompaniesFilter,
  isLeadsFilter,
  isCryptoOrdersFilter,
  isInvoiceListFilter,
  isTicketsListFilter,
  isNFTRankingFilter,
  isTaskListFilter,
  customPageSize,
  tableClass,
  theadClass,
  trClass,
  thClass,
  divClass,
  SearchPlaceholder,
  isPagination,
  totalDataCount,
  onPageChange,
  onPageSizeChange,
  currentPage,
}: TableContainerProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({
      itemRank
    });
    return itemRank.passed;
  };

  const table = useReactTable({
    columns,
    data,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageOptions,
    setPageIndex,
    nextPage,
    previousPage,
    setPageSize,
    getState
  } = table;

  useEffect(() => {
    Number(customPageSize) && setPageSize(Number(customPageSize));
  }, [customPageSize, setPageSize]);

  // Enhanced pagination with limits and ellipsis
  const getVisiblePages = () => {
    const totalPages = isPagination ? Math.ceil((totalDataCount || 0) / (customPageSize || 10)) : getPageOptions().length;
    const current = isPagination ? (currentPage || 0) : getState().pagination.pageIndex;
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = 0; i < totalPages; i++) {
      if (
        i === 0 || // First page
        i === totalPages - 1 || // Last page
        (i >= current - delta && i <= current + delta) // Pages around current page
      ) {
        range.push(i);
      }
    }

    let prev = -1;
    for (const i of range) {
      if (prev !== -1 && i - prev !== 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  // Calculate showing range
  const getShowingRange = () => {
    if (isPagination) {
      const start = (currentPage || 0) * (customPageSize || 10) + 1;
      const end = Math.min(((currentPage || 0) + 1) * (customPageSize || 10), totalDataCount || 0);
      return { start, end, total: totalDataCount || 0 };
    }
    const { pageIndex, pageSize } = getState().pagination;
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, data.length);
    return { start, end, total: data.length };
  };

  const { start, end, total } = getShowingRange();

  return (
    <Fragment>
      {isGlobalFilter && <Row className="mb-3">
        <CardBody className="border border-dashed border-end-0 border-start-0">
          <form>
            <Row>
              <Col sm={5}>
                <div className={(isProductsFilter || isContactsFilter || isCompaniesFilter || isNFTRankingFilter) ? "search-box me-2 mb-2 d-inline-block" : "search-box me-2 mb-2 d-inline-block col-12"}>
                  <DebouncedInput
                    value={globalFilter ?? ''}
                    onChange={value => setGlobalFilter(String(value))}
                    placeholder={SearchPlaceholder}
                  />
                  <i className="bx bx-search-alt search-icon"></i>
                </div>
              </Col>
              {isProductsFilter && (
                <ProductsGlobalFilter />
              )}
              {isCustomerFilter && (
                <CustomersGlobalFilter />
              )}
              {isOrderFilter && (
                <OrderGlobalFilter />
              )}
              {isContactsFilter && (
                <ContactsGlobalFilter />
              )}
              {isCompaniesFilter && (
                <CompaniesGlobalFilter />
              )}
              {isLeadsFilter && (
                <LeadsGlobalFilter />
              )}
              {isCryptoOrdersFilter && (
                <CryptoOrdersGlobalFilter />
              )}
              {isInvoiceListFilter && (
                <InvoiceListGlobalSearch />
              )}
              {isTicketsListFilter && (
                <TicketsListGlobalFilter />
              )}
              {isNFTRankingFilter && (
                <NFTRankingGlobalFilter />
              )}
              {isTaskListFilter && (
                <TaskListGlobalFilter />
              )}
            </Row>
          </form>
        </CardBody>
      </Row>}


      <div className={divClass}>
        <Table hover className={tableClass}>
          <thead className={theadClass}>
            {getHeaderGroups().map((headerGroup: any) => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <th key={header.id} className={thClass}  {...{
                    onClick: header.column.getToggleSortingHandler(),
                  }}>
                    {header.isPlaceholder ? null : (
                      <React.Fragment>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' ',
                          desc: ' ',
                        }
                        [header.column.getIsSorted() as string] ?? null}
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </React.Fragment>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {getRowModel().rows.map((row: any) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell: any) => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <Row className="align-items-center mt-2 g-3">
        <Col>
          <div className="d-flex gap-3 flex-wrap align-items-center justify-content-between">
            {/* Showing Results */}
            <div className="text-muted">
              Showing <span className="fw-semibold">{start}</span> to <span className="fw-semibold">{end}</span> of <span className="fw-semibold">{total}</span> Results
            </div>

            <div className="d-flex gap-3 flex-wrap align-items-center">
              {/* Page Size Dropdown */}
              <div className="d-flex align-items-center">
                <span className="text-muted text-nowrap me-2">Show:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={isPagination ? customPageSize : getState().pagination.pageSize}
                  onChange={e => {
                    const size = Number(e.target.value);
                    if (isPagination) {
                      onPageSizeChange?.(size);
                    } else {
                      setPageSize(size);
                    }
                  }}
                >
                  {[10, 25, 50, 100].map(pageSizeOption => (
                    <option key={pageSizeOption} value={pageSizeOption}>
                      {pageSizeOption}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagination Buttons */}
              <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                <li className={(isPagination ? (currentPage === 0) : !getCanPreviousPage()) ? "page-item disabled" : "page-item"}>
                  <Link to="#" className="page-link" onClick={() => isPagination ? onPageChange?.(0) : setPageIndex(0)} title="First Page">
                    «
                  </Link>
                </li>

                <li className={(isPagination ? (currentPage === 0) : !getCanPreviousPage()) ? "page-item disabled" : "page-item"}>
                  <Link to="#" className="page-link" onClick={() => isPagination ? onPageChange?.((currentPage || 0) - 1) : previousPage()}>Previous</Link>
                </li>

                {getVisiblePages().map((page: any, key: number) => (
                  <li className={`page-item ${(isPagination ? currentPage : getState().pagination.pageIndex) === page ? "active" : ""} ${page === '...' ? "disabled" : ""}`} key={key}>
                    {page === '...' ? (
                      <span className="page-link">...</span>
                    ) : (
                      <Link
                        to="#"
                        className="page-link"
                        onClick={() => isPagination ? onPageChange?.(page) : setPageIndex(page)}
                      >
                        {page + 1}
                      </Link>
                    )}
                  </li>
                ))}

                <li className={(isPagination ? ((currentPage || 0) >= Math.ceil((totalDataCount || 0) / (customPageSize || 10)) - 1) : !getCanNextPage()) ? "page-item disabled" : "page-item"}>
                  <Link to="#" className="page-link" onClick={() => isPagination ? onPageChange?.((currentPage || 0) + 1) : nextPage()}>Next</Link>
                </li>

                <li className={(isPagination ? ((currentPage || 0) >= Math.ceil((totalDataCount || 0) / (customPageSize || 10)) - 1) : !getCanNextPage()) ? "page-item disabled" : "page-item"}>
                  <Link
                    to="#"
                    className="page-link"
                    onClick={() => isPagination ? onPageChange?.(Math.ceil((totalDataCount || 0) / (customPageSize || 10)) - 1) : setPageIndex(getPageOptions().length - 1)}
                    title="Last Page"
                  >
                    »
                  </Link>
                </li>
              </ul>

              {/* Quick Jump */}
              <div className="d-flex align-items-center">
                <span className="text-muted text-nowrap me-2">Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={getPageOptions().length}
                  defaultValue={getState().pagination.pageIndex + 1}
                  onChange={e => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                    setPageIndex(Math.max(0, Math.min(page, getPageOptions().length - 1)));
                  }}
                  className="form-control form-control-sm"
                  style={{ width: '70px' }}
                />
                <span className="text-muted ms-2 text-nowrap">of {getPageOptions().length}</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Fragment>
  );
};

export default TableContainer;