/* eslint-disable no-underscore-dangle */
'use strict';

export function jsonldVis(jsonld, selector, config) {
  if (!arguments.length) return jsonldVis;
  config = config || {};

  const h = config.h || 600
  const w = config.w || 800
  const maxLabelWidth = config.maxLabelWidth || 250
  const transitionDuration = config.transitionDuration || 750
  const transitionEase = config.transitionEase || 'cubic-in-out'
  const minRadius = config.minRadius || 5
  const scalingFactor = config.scalingFactor || 2

  let i = 0;

  const tree = d3.layout.tree()
    .size([h, w]);

  const diagonal = d3.svg.diagonal()
    .projection(function (d) { return [d.y, d.x]; });

  const svg = d3.select(selector).append('svg')
    .attr('width', w)
    .attr('height', h)
    .append('g')
    .attr('transform', 'translate(' + maxLabelWidth + ',0)');

  const tip = d3.tip()
    .direction(function (d) {
      return d.children || d._children ? 'w' : 'e';
    })
    .offset(function (d) {
      return d.children || d._children ? [0, -3] : [0, 3];
    })
    .attr('class', 'd3-tip')
    .html(function (d) {
      return '<span>' + d.valueExtended + '</span>';
    });

  svg.call(tip);

  const treeData = {
    name: jsonld.title || `_${Math.random().toString(10).slice(-7)}`,
    isIdNode: true,
    isBlankNode: true,
    children: jsonldTree(jsonld)
  };

  const root = treeData;
  root.x0 = h / 2;
  root.y0 = 0;
  root.children.forEach(child => collapse(child));

  function changeSVGWidth(newWidth) {
    if (w !== newWidth) {
      d3.select(selector + ' > svg').attr('width', newWidth);
    }
  }

  function jsonldTree(source) {
    const children = [];

    Object.keys(source).forEach(key => {
      if (key === '@id' || key === '@context' || source[key] === null) return;

      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        children.push(
          {
            name: key,
            children: jsonldTree(source[key])
          }
        );
      } else if (Array.isArray(source[key])) {
        children.push(
          {
            name: key,
            children: source[key].map((e, j) => {
              if (typeof e === 'object') {
                return { name: j, children: jsonldTree(e) };
              } else {
                return { name: e };
              }
            })
          }
        );
      } else {

        const truncateValue = (value, limit) => {
          value = value.slice(0, limit);
          if (value.getDirection() === 'rtl') return `...${value}`;
          return `${value}...`;
        };

        const stringLimit = Math.floor(maxLabelWidth / 9);
        const d = (`${source[key]}`.length > stringLimit) ? {
          name: key,
          value: truncateValue(source[key], stringLimit),
          valueExtended: source[key]
        } : {
          name: key,
          value: source[key]
        };

        children.push(d);
      }
    });

    return children;
  }

  function update(source) {
    const nodes = tree.nodes(root).reverse();
    const links = tree.links(nodes);

    nodes.forEach(function (d) { d.y = d.depth * maxLabelWidth; });

    const node = svg.selectAll('g.node')
      .data(nodes, function (d) { return d.id || (d.id = ++i); });

    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', function (d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
      .on('click', click);

    nodeEnter.append('circle')
      .attr('r', 0)
      .style('stroke-width', function (d) {
        return d.isIdNode ? '2px' : '1px';
      })
      .style('stroke', function (d) {
        return d.isIdNode ? '#F7CA18' : '#4ECDC4';
      })
      .style('fill', function (d) {
        if (d.isIdNode) {
          return d._children ? '#F5D76E' : 'white';
        } else {
          return d._children ? '#86E2D5' : 'white';
        }
      })
      .on('mouseover', function (d) { if (d.valueExtended) tip.show(d); })
      .on('mouseout', tip.hide);

    nodeEnter.append('text')
      .attr('x', function (d) {
        const spacing = computeRadius(d) + 5;
        return d.children || d._children ? -spacing : spacing;
      })
      .attr('dy', '4')
      .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
      .text(function (d) { return d.name + (d.value ? ': ' + d.value : ''); })
      .style('fill-opacity', 0);

    const maxSpan = Math.max.apply(Math, nodes.map(function (d) { return d.y + maxLabelWidth; }));
    if (maxSpan + maxLabelWidth + 20 > w) {
      changeSVGWidth(maxSpan + maxLabelWidth);
      d3.select(selector).node().scrollLeft = source.y0;
    }

    const nodeUpdate = node.transition()
      .duration(transitionDuration)
      .ease(transitionEase)
      .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; });

    nodeUpdate.select('circle')
      .attr('r', function (d) { return computeRadius(d); })
      .style('stroke-width', function (d) {
        return d.isIdNode ? '2px' : '1px';
      })
      .style('stroke', function (d) {
        return d.isIdNode ? '#F7CA18' : '#4ECDC4';
      })
      .style('fill', function (d) {
        if (d.isIdNode) {
          return d._children ? '#F5D76E' : 'white';
        } else {
          return d._children ? '#86E2D5' : 'white';
        }
      });

    nodeUpdate.select('text').style('fill-opacity', 1);

    const nodeExit = node.exit().transition()
      .duration(transitionDuration)
      .ease(transitionEase)
      .attr('transform', function (d) { return 'translate(' + source.y + ',' + source.x + ')'; })
      .remove();

    nodeExit.select('circle').attr('r', 0);
    nodeExit.select('text').style('fill-opacity', 0);

    const link = svg.selectAll('path.link')
      .data(links, function (d) { return d.target.id; });

    link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', function (d) {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    link.transition()
      .duration(transitionDuration)
      .ease(transitionEase)
      .attr('d', diagonal);

    link.exit().transition()
      .duration(transitionDuration)
      .ease(transitionEase)
      .attr('d', function (d) {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      })
      .remove();

    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  function computeRadius(d) {
    if (d.children || d._children) {
      return minRadius + (numEndNodes(d) / scalingFactor);
    } else {
      return minRadius;
    }
  }

  function numEndNodes(n) {
    let num = 0;
    if (n.children) {
      n.children.forEach(function (c) {
        num += numEndNodes(c);
      });
    } else if (n._children) {
      n._children.forEach(function (c) {
        num += numEndNodes(c);
      });
    } else {
      num++;
    }
    return num;
  }

  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }

    update(d);

    // fast-forward blank nodes
    if (d.children) {
      d.children.forEach(function (child) {
        if (child.isBlankNode && child._children) {
          click(child);
        }
      });
    }
  }

  function collapse(d, toUpdate = false) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(child => collapse(child));
      d.children = null;

      if (toUpdate) {
        update(d);
      }
    }
  }

  function expand(d, toUpdate = false) {
    if (d._children) {
      d.children = d._children;
      d.children.forEach(child => expand(child));
      d._children = null;
    } else if (d.children) {
      d.children.forEach(child => expand(child));
    }

    if (toUpdate) update(d);
  }

  update(root);

  document.getElementById('vis-collapse-all').addEventListener('click', _ => collapse(root, true));
  document.getElementById('vis-expand-all').addEventListener('click', _ => expand(root, true));
}
