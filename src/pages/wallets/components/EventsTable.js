// SPDX-FileCopyrightText: © 2022 Dai Foundation <www.daifoundation.org>
//
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from "react";
import DateTimeAgo from "../../../components/DateTime/DateTimeAgo.js";
import Loader from "../../../components/Loader/Loader.js";
import RemoteTable from "../../../components/Table/RemoteTable.js";
import Value from "../../../components/Value/Value.js";
import ValueChange from "../../../components/Value/ValueChange.js";
import { withErrorBoundary } from "../../../hoc.js";
import { useFetch } from "../../../hooks";
import { parseUTCDateTime } from "../../../utils/datetime.js";

function EventsTable(props) {
  const { address, showAllVaults } = props;
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState(null);
  const { data, isLoading, isPreviousData, isError, ErrorFallbackComponent } = useFetch(
    `/wallets/${address}/events/`,
    {
      all_vaults: showAllVaults,
      p: page,
      p_size: pageSize,
      order,
    },
    { keepPreviousData: true }
  );

  if (isLoading) {
    return <Loader />;
  } else if (isError) {
    return <ErrorFallbackComponent />;
  }

  return (
    <RemoteTable
      loading={isPreviousData}
      keyField="timestamp"
      hover={false}
      data={data.results}
      columns={[
        {
          dataField: "datetime",
          text: "Date",
          formatter: (cell, row) => <DateTimeAgo dateTime={parseUTCDateTime(cell)} />,
          sort: true,
          headerAlign: "left",
          align: "left",
        },
        {
          dataField: "block_number",
          text: "Block",
          formatter: (cell, row) => (
            <a
              href={`https://ethtx.info/mainnet/${row.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {cell}
            </a>
          ),
          sort: true,
        },
        {
          dataField: "ilk",
          text: "ILK",
          sort: true,
          headerAlign: "center",
          align: "center",
        },
        {
          dataField: "vault_uid",
          text: "vault",
          sort: true,
        },
        {
          dataField: "human_operation",
          text: "Event",
        },
        {
          dataField: "collateral",
          text: "Collateral change",
          sort: true,
          formatter: (cell, row) => (
            <>
              {cell ? (
                <>
                  <div className="flex-column justifiy-content-end">
                    <ValueChange value={cell} decimals={2} compact hideIfZero />
                    <br></br>
                    <small>
                      (
                      <ValueChange
                        value={cell * row.osm_price}
                        prefix="$"
                        decimals={2}
                        compact
                        hideIfZero
                      />{" "}
                      )
                    </small>
                  </div>
                </>
              ) : null}
            </>
          ),
          headerAlign: "right",
          align: "right",
        },
        {
          dataField: "principal",
          text: "Debt Change",
          sort: true,
          formatter: (cell, row) => (
            <ValueChange value={cell} decimals={2} prefix="$" compact hideIfZero />
          ),
          headerAlign: "right",
          align: "right",
        },
        {
          dataField: "before_ratio",
          text: "CR",
          sort: true,
          formatter: (cell, row) => (
            <>
              <div className="text-nowrap">
                <Value value={cell} decimals={0} suffix="%" /> ->{" "}
                <Value value={row.after_ratio} decimals={0} suffix="%" />{" "}
              </div>
            </>
          ),
          headerAlign: "center",
          align: "center",
        },
      ]}
      page={page}
      pageSize={pageSize}
      totalPageSize={data.count}
      onSortChange={setOrder}
      onPageChange={setPage}
    />
  );
}

export default withErrorBoundary(EventsTable);
