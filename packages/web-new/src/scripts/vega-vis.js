/**
 * @file The `vega-vis.js` handles the vega visualization for the
 * tree option, by utilizin the vega and vega-embed dependencies
 */

import vegaEmbed from 'vega-embed'

/**
 * Initialize and generat the Vega visualization by passing the container element and the td content
 * @param { html element } visContainer - Html container for the svg visualization
 * @param { json object } td - Json object from the current editor
 */
export async function vegaVis(visContainer, td) {

  const treeData = [
    {
      id: '0',
      name: td.title,
      parent: null
    }
  ];
  const conf = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "A radial tree visualization for a W3C Thing Description.",
    "width": document.getElementById("visualize-container").offsetWidth - 20,
    "height": document.getElementById("visualize-container").offsetHeight - 30,

    "signals": [
      {
        "name": "labels", "value": true,
        "bind": {
          "input": "checkbox",
          "element": "#vega-bindings-wrapper"
        }
      },
      {
        "name": "radius", "value": 350,
        "bind": {
          "input": "range",
          "min": 20,
          "max": 800,
          "element": "#vega-bindings-wrapper"
        }
      },
      {
        "name": "extent", "value": 360,
        "bind": {
          "input": "range",
          "min": 0,
          "max": 360,
          "step": 1,
          "element": "#vega-bindings-wrapper"
        }
      },
      {
        "name": "rotate", "value": 0,
        "bind": {
          "input": "range",
          "min": 0,
          "max": 360,
          "step": 1,
          "element": "#vega-bindings-wrapper"
        }
      },
      {
        "name": "dragPrecision", "value": 100,
        "bind": {
          "input": "range",
          "min": 1,
          "max": 100,
          "step": 1,
          "name": "drag precision",
          "element": "#vega-bindings-wrapper"
        }
      },
      {
        "name": "layout", "value": "tidy",
        "bind": {
          "input": "radio",
          "options": ["tidy", "cluster"],
          "element": "#vega-bindings-wrapper"
        }
      },
      {
        "name": "links", "value": "line",
        "bind": {
          "input": "select",
          "options": ["line", "curve", "diagonal", "orthogonal"],
          "element": "#vega-bindings-wrapper"
        }
      },
      {
        "name": "start",
        "value": null,
        "on": [
          {
            "events": "mousedown",
            "update": "xy()"
          }
        ]
      },
      {
        "name": "drag",
        "value": null,
        "on": [
          {
            "events": "[mousedown, window:mouseup] > window:mousemove",
            "update": "xy()"
          }
        ]
      },
      {
        "name": "originX",
        "update": "width / 2",
        "on": [
          {
            "events": { "signal": "drag" },
            "update": "clamp((drag[0] - start[0]) / dragPrecision + originX, 0, width)"
          }
        ]
      },
      {
        "name": "originY",
        "update": "height / 2",
        "on": [
          {
            "events": { "signal": "drag" },
            "update": "clamp((drag[1] - start[1]) / dragPrecision + originY, 0, height)"
          }
        ]
      }
    ],

    "data": [
      {
        "name": "tree",
        "values": treeData,
        "transform": [
          {
            "type": "stratify",
            "key": "id",
            "parentKey": "parent"
          },
          {
            "type": "tree",
            "method": { "signal": "layout" },
            "size": [1, { "signal": "radius" }],
            "as": ["alpha", "radius", "depth", "children"]
          },
          {
            "type": "formula",
            "expr": "(rotate + extent * datum.alpha + 270) % 360",
            "as": "angle"
          },
          {
            "type": "formula",
            "expr": "PI * datum.angle / 180",
            "as": "radians"
          },
          {
            "type": "formula",
            "expr": "inrange(datum.angle, [90, 270])",
            "as": "leftside"
          },
          {
            "type": "formula",
            "expr": "originX + datum.radius * cos(datum.radians)",
            "as": "x"
          },
          {
            "type": "formula",
            "expr": "originY + datum.radius * sin(datum.radians)",
            "as": "y"
          }
        ]
      },
      {
        "name": "links",
        "source": "tree",
        "transform": [
          { "type": "treelinks" },
          {
            "type": "linkpath",
            "shape": { "signal": "links" }, "orient": "radial",
            "sourceX": "source.radians", "sourceY": "source.radius",
            "targetX": "target.radians", "targetY": "target.radius"
          }
        ]
      }
    ],

    "scales": [
      {
        "name": "color",
        "type": "linear",
        "range": { "scheme": "magma" },
        "domain": { "data": "tree", "field": "depth" },
        "zero": true
      }
    ],

    "marks": [
      {
        "type": "path",
        "from": { "data": "links" },
        "encode": {
          "update": {
            "x": { "signal": "originX" },
            "y": { "signal": "originY" },
            "path": { "field": "path" },
            "stroke": { "value": "#ccc" }
          }
        }
      },
      {
        "type": "symbol",
        "from": { "data": "tree" },
        "encode": {
          "enter": {
            "size": { "value": 100 },
            "stroke": { "value": "#fff" }
          },
          "update": {
            "x": { "field": "x" },
            "y": { "field": "y" },
            "fill": { "scale": "color", "field": "depth" }
          }
        }
      },
      {
        "type": "text",
        "from": { "data": "tree" },
        "encode": {
          "enter": {
            "text": { "field": "name" },
            "fontSize": { "value": 12 },
            "baseline": { "value": "middle" }
          },
          "update": {
            "x": { "field": "x" },
            "y": { "field": "y" },
            "dx": { "signal": "(datum.leftside ? -1 : 1) * 6" },
            "angle": { "signal": "datum.leftside ? datum.angle - 180 : datum.angle" },
            "align": { "signal": "datum.leftside ? 'right' : 'left'" },
            "opacity": { "signal": "labels ? 1 : 0" }
          }
        }
      }
    ]
  };

  function tdToVega(source, parent) {
    Object.keys(source).forEach((key, index) => {
      if (key === '@id' || key === '@context' || source[key] === null) return;

      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        treeData.push(
          {
            id: `${parent}_${index}`,
            name: key,
            parent
          }
        );

        tdToVega(source[key], `${parent}_${index}`);

      } else if (Array.isArray(source[key])) {
        treeData.push(
          {
            id: `${parent}_${index}`,
            name: key,
            parent
          }
        );

        source[key].map((e, i) => {
          if (typeof e === 'object') {
            treeData.push(
              {
                id: `${parent}_${index}_${i}`,
                name: `${i}`,
                parent: `${parent}_${index}`
              }
            );

            tdToVega(e, `${parent}_${index}_${i}`);
          } else {
            treeData.push({
              id: `${parent}_${index}_${i}`,
              name: e,
              parent: `${parent}_${index}`
            });
          }
        });

      } else {
        treeData.push({
          id: `${parent}_${index}`,
          name: key,
          parent
        });
      }
    });
  }

  tdToVega(td, treeData[0].id);

  window.vegaObj = await vegaEmbed(
    visContainer,
    conf,
    {
      actions: false,
      renderer: 'svg'
    }
  );
}