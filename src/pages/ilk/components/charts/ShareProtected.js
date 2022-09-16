import React from "react";
import Graph from "../../../../components/Graph/Graph.js";
import { withErrorBoundary } from "../../../../hoc.js";
import { tooltipLabelNumber } from "../../../../utils/graph.js";
import { compact } from "../../../../utils/number.js";

function ShareProtected(props) {
  const { data } = props;

  const { results } = data;
  const series = [
    {
      data: results.map((row) => ({
        x: row["datetime"],
        y: row["share_vaults_protected"],
      })),
    },
  ];
  const options = {
    aspectRatio: 4,
    interaction: {
      axis: "x",
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
        },
      },
      y: {
        ticks: {
          callback: (value) => compact(value * 100, 2, true) + "%",
        },

        title: {
          display: true,
          text: "vaults protected share",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return tooltipLabelNumber(tooltipItem, null, "%");
          },
        },
      },
    },
  };

  return (
    <>
      <Graph series={series} options={options} />
    </>
  );
}

export default withErrorBoundary(ShareProtected);
