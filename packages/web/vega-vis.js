export async function vegaVis($container, td) {

    const treeData = [
        {
            id: '0',
            name: td['title'],
            parent: null,
        }
    ];
    const conf = {
        "$schema": "https://vega.github.io/schema/vega/v5.json",
        "description": "A radial tree visualization for a W3C Thing Description.",
        "width": document.getElementById('visualized-wrapper').offsetWidth,
        "height": document.getElementById('visualized-wrapper').offsetHeight,
        "padding": 5,

        "signals": [
          {
            "name": "labels", "value": true,
            "bind": {"input": "checkbox"}
          },
          {
            "name": "radius", "value": 280,
            "bind": {"input": "range", "min": 20, "max": 600}
          },
          {
            "name": "extent", "value": 360,
            "bind": {"input": "range", "min": 0, "max": 360, "step": 1}
          },
          {
            "name": "rotate", "value": 0,
            "bind": {"input": "range", "min": 0, "max": 360, "step": 1}
          },
          {
            "name": "layout", "value": "tidy",
            "bind": {"input": "radio", "options": ["tidy", "cluster"]}
          },
          {
            "name": "links", "value": "line",
            "bind": {
              "input": "select",
              "options": ["line", "curve", "diagonal", "orthogonal"]
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
                "update": "clamp((drag[0] - start[0]) / 10 + originX, 0, width)"
              }
            ]
          },
          {
            "name": "originY",
            "update": "height / 2",
            "on": [
              {
                "events": { "signal": "drag" },
                "update": "clamp((drag[1] - start[1]) / 10 + originY, 0, height)"
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
                "method": {"signal": "layout"},
                "size": [1, {"signal": "radius"}],
                "as": ["alpha", "radius", "depth", "children"]
              },
              {
                "type": "formula",
                "expr": "(rotate + extent * datum.alpha + 270) % 360",
                "as":   "angle"
              },
              {
                "type": "formula",
                "expr": "PI * datum.angle / 180",
                "as":   "radians"
              },
              {
                "type": "formula",
                "expr": "inrange(datum.angle, [90, 270])",
                "as":   "leftside"
              },
              {
                "type": "formula",
                "expr": "originX + datum.radius * cos(datum.radians)",
                "as":   "x"
              },
              {
                "type": "formula",
                "expr": "originY + datum.radius * sin(datum.radians)",
                "as":   "y"
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
                "shape": {"signal": "links"}, "orient": "radial",
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
            "range": {"scheme": "magma"},
            "domain": {"data": "tree", "field": "depth"},
            "zero": true
          }
        ],

        "marks": [
          {
            "type": "path",
            "from": {"data": "links"},
            "encode": {
              "update": {
                "x": {"signal": "originX"},
                "y": {"signal": "originY"},
                "path": {"field": "path"},
                "stroke": {"value": "#ccc"}
              }
            }
          },
          {
            "type": "symbol",
            "from": {"data": "tree"},
            "encode": {
              "enter": {
                "size": {"value": 100},
                "stroke": {"value": "#fff"}
              },
              "update": {
                "x": {"field": "x"},
                "y": {"field": "y"},
                "fill": {"scale": "color", "field": "depth"}
              }
            }
          },
          {
            "type": "text",
            "from": {"data": "tree"},
            "encode": {
              "enter": {
                "text": {"field": "name"},
                "fontSize": {"value": 9},
                "baseline": {"value": "middle"}
              },
              "update": {
                "x": {"field": "x"},
                "y": {"field": "y"},
                "dx": {"signal": "(datum.leftside ? -1 : 1) * 6"},
                "angle": {"signal": "datum.leftside ? datum.angle - 180 : datum.angle"},
                "align": {"signal": "datum.leftside ? 'right' : 'left'"},
                "opacity": {"signal": "labels ? 1 : 0"}
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
                        parent: parent
                    }
                );

                tdToVega(source[key], `${parent}_${index}`);

            } else if (Array.isArray(source[key])) {
                treeData.push(
                    {
                        id: `${parent}_${index}`,
                        name: key,
                        parent: parent
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
                            parent: `${parent}_${index}`,
                        });
                    }
                });

            } else {
                treeData.push({
                    id: `${parent}_${index}`,
                    name: key,
                    parent: parent
                });
            }
        });
    }

    tdToVega(td, treeData[0].id);

    window.vegaObj = await vegaEmbed(
        $container,
        conf,
        {
          actions: false
        }
    );
}
