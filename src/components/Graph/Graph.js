// SPDX-FileCopyrightText: © 2022 Dai Foundation <www.daifoundation.org>
//
// SPDX-License-Identifier: Apache-2.0

import { Chart as ChartJS, registerables } from "chart.js";
import "chartjs-adapter-luxon";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import annotationPlugin from "chartjs-plugin-annotation";
import ChartDataLabels from "chartjs-plugin-datalabels";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { Chart } from "react-chartjs-2";

ChartJS.register(...registerables, annotationPlugin, MatrixElement, MatrixController);
ChartJS.defaults.color = "#F6F7F8";

const PROTECTION_SCORE_PALETTE = {
  low: "#03640a",
  medium: "#929629",
  high: "#9e0d25",
};

export const DEFAULT_PALETTE = [
  "#03A9F4",
  "#FF4560",
  "#775DD0",
  "#3F51B5",
  "#4CAF50",
  "#F9CE1D",
  "#008FFB",
  "#00E396",
  "#FEB019",
  "#0276aa",
  "#e20020",
  "#492fa3",
  "#2c387e",
  "#357a38",
  "#bd9905",
  "#0064af",
  "#009e69",
  "#c28000",
  "#014361",
  "#810012",
  "#2a1b5d",
  "#192048",
  "#1e4620",
  "#6c5702",
  "#003964",
  "#005a3c",
  "#6f4900",
  "#22b8fc",
  "#ff6077",
  "#8b75d7",
  "#5767c4",
  "#65bc69",
  "#f9d53e",
];

const PROTOCOLS_PALETTE = {
  aave: "#B6509E",
  aaveV2: "#B6509E",
  aaveV3: "#b65085",
  compound: "#00D395",
  maker: "#F4B731",
  compoundV3: "#00d360",
  euler: "#e5615e",
  alchemix: "#f5c09a",
};

export const ASSETS_PALETTE = {
  ETH: "#858585",
  WETH: "#858585",
  LINK: "#2a5ada",
  MANA: "#ff2d55",
  MATIC: "#7b3fe4",
  BTC: "#ef8e19",
  WBTC: "#ef8e19",
  RENBTC: "#e65231",
  STETH: "#00a3ff",
  WSTETH: "#00a3ff",
  YFI: "#006ae3",
  UNI: "#ff007a",
  TUSD: "#2b2e7f",
  ZRX: "#FFFFF0",
  AAVE: "#2ebac6",
  BAT: "#ff5000",
  Other: "#FFFFFF",
  other: "#FFFFFF",
  Others: "#FFFFFF",
  others: "#FFFFFF",
};

function Graph(props) {
  let { series, type, options, labels, ...rest } = props;

  const defaultOptions = {
    aspectRatio: 2,
    onResize: (chart, size) => {
      const ratio = chart.config.options.aspectRatio;
      if (size.width < 576 && ratio !== 1) {
        chart.config.options.oldAspectRatio = ratio;
        chart.config.options.aspectRatio = 1;
      } else if (
        size.width >= 576 &&
        chart.config.options.oldAspectRatio > 0 &&
        ratio !== chart.config.options.oldAspectRatio
      ) {
        chart.config.options.aspectRatio = chart.config.options.oldAspectRatio;
      }
    },
    fill: false,
    interaction: {
      intersect: false,
      mode: "nearest",
      axis: "xy",
    },
    events: ["mousemove", "mouseout", "click", "touchstart", "touchmove", "dblclick"],
    plugins: {
      tooltip: {
        usePointStyle: true,
        boxPadding: 5,
        footerColor: "#ccc",
        footerFont: { weight: "400" },
      },
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
        },
      },
    },
    animation: {
      duration: 400,
    },
  };

  const plugins = [];
  let xScaleTicks = [];
  let yScaleTicks = [];

  let graphType = type;
  switch (type) {
    case "bar":
      defaultOptions["interaction"]["intersect"] = false;
      defaultOptions["interaction"]["mode"] = "x";
      break;
    case "line":
      defaultOptions["radius"] = 0;
      break;
    case "pie":
      defaultOptions["interaction"]["intersect"] = true;
      defaultOptions["plugins"]["legend"]["position"] = "right";
      plugins.push(ChartDataLabels);
      break;
    case "heatmap":
      if (series.length !== 1) {
        throw Error("Heatmap supports only one serie");
      }

      graphType = "matrix";
      var oldAfterDatasetUpdate = ChartDataLabels.afterDatasetUpdate;
      ChartDataLabels.afterDatasetUpdate = function (chart, args, options) {
        oldAfterDatasetUpdate(chart, args, options);
        chart.$datalabels._datasets[0].map(({ _model, $context }) => {
          return (_model.positioner = function (el, config) {
            return {
              x: el.x + el.width / 2,
              y: el.y + el.height / 2,
            };
          });
        });
      };
      // Disable afterEvent as it breaks datalabels as we're hacking them for
      // positioning
      ChartDataLabels.afterEvent = null;
      plugins.push(ChartDataLabels);

      xScaleTicks = Object.keys(_.groupBy(series[0].data, "x"))
        .map((x) => Number(x))
        .sort(function (a, b) {
          return a - b;
        });
      yScaleTicks = Object.keys(_.groupBy(series[0].data, "y"))
        .map((y) => Number(y))
        .sort(function (a, b) {
          return a - b;
        });

      defaultOptions["scales"] = {
        x: {
          offset: true,
          min: xScaleTicks[0],
          max: xScaleTicks[xScaleTicks.length - 1],
          ticks: {
            autoSkip: false,
            count: xScaleTicks.length,
          },
        },
        y: {
          offset: true,
          reverse: false,
          min: yScaleTicks[0],
          max: yScaleTicks[xScaleTicks.length - 1],
          ticks: {
            autoSkip: false,
            count: yScaleTicks.length,
          },
        },
      };
      defaultOptions["plugins"]["datalabels"] = {
        align: "center",
        anchor: "bottom",
        offset: 5,
        clamp: true,
        formatter: (value, ctx) => {
          return value.z || "";
        },
      };

      break;
    default: // pass
  }
  const mergedOptions = _.merge(defaultOptions, options);

  const updatedSeries = series.map((serie, index) => {
    let bgColor = DEFAULT_PALETTE[index];
    if (type === "pie") {
      return {
        backgroundColor: serie.protocols ? bgColor : DEFAULT_PALETTE,
        borderColor: serie.protocols ? bgColor : DEFAULT_PALETTE,
        ...serie,
      };
    } else if (type === "heatmap") {
      return {
        width: ({ chart }) => {
          const scaleWidth = (chart.scales || {}).y.width;
          return ((chart.chartArea || {}).width - scaleWidth) / xScaleTicks.length;
        },
        height: ({ chart }) => {
          const scaleHeight = (chart.scales || {}).x.height;
          return ((chart.chartArea || {}).height - scaleHeight) / yScaleTicks.length;
        },
        anchorX: "center",
        anchorY: "center",
        ...serie,
      };
    } else {
      if (serie.protection_score) {
        bgColor = PROTECTION_SCORE_PALETTE[serie.protection_score];
      }
      if (serie.protocol) {
        bgColor = PROTOCOLS_PALETTE[serie.protocol];
      }
      if (serie.asset) {
        bgColor = ASSETS_PALETTE[serie.asset] || bgColor;
      }
      return {
        backgroundColor: bgColor,
        borderColor: bgColor,
        ...serie,
      };
    }
  });

  return (
    <Chart
      type={graphType}
      data={{ datasets: updatedSeries, labels }}
      options={mergedOptions}
      plugins={plugins}
      {...rest}
    />
  );
}

Graph.propTypes = {
  series: PropTypes.array.isRequired,
  labels: PropTypes.array,
  type: PropTypes.string.isRequired,
  options: PropTypes.object,
  layout: PropTypes.object,
};

Graph.defaultProps = {
  type: "line",
};

export default Graph;
