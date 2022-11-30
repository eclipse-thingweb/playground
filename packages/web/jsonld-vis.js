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
      return d.children || d.privChildren ? 'w' : 'e';
    })
    .offset(function (d) {
      return d.children || d.privChildren ? [0, -3] : [0, 3];
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

  function getDirectedValue(source, key) {
    const LRI = '\u2066';
    const RLI = '\u2067';
    const TABLE = {
      ar: 'rtl',
      fa: 'rtl',
      ps: 'rtl',
      ur: 'rtl',
      hy: 'ltr',
      as: 'ltr',
      bn: 'ltr',
      zb: 'ltr',
      ab: 'ltr',
      be: 'ltr',
      bg: 'ltr',
      kk: 'ltr',
      mk: 'ltr',
      ru: 'ltr',
      uk: 'ltr',
      hi: 'ltr',
      mr: 'ltr',
      ne: 'ltr',
      ko: 'ltr',
      ma: 'ltr',
      am: 'ltr',
      ti: 'ltr',
      ka: 'ltr',
      el: 'ltr',
      gu: 'ltr',
      pa: 'ltr',
      he: 'rtl',
      iw: 'rtl',
      yi: 'rtl',
      ja: 'ltr',
      km: 'ltr',
      kn: 'ltr',
      lo: 'ltr',
      af: 'ltr',
      ay: 'ltr',
      bs: 'ltr',
      ca: 'ltr',
      ch: 'ltr',
      cs: 'ltr',
      cy: 'ltr',
      da: 'ltr',
      de: 'ltr',
      en: 'ltr',
      eo: 'ltr',
      es: 'ltr',
      et: 'ltr',
      eu: 'ltr',
      fi: 'ltr',
      fj: 'ltr',
      fo: 'ltr',
      fr: 'ltr',
      fy: 'ltr',
      ga: 'ltr',
      gl: 'ltr',
      gn: 'ltr',
      gv: 'ltr',
      hr: 'ltr',
      ht: 'ltr',
      hu: 'ltr',
      id: 'ltr',
      in: 'ltr',
      is: 'ltr',
      it: 'ltr',
      kl: 'ltr',
      la: 'ltr',
      lb: 'ltr',
      ln: 'ltr',
      lt: 'ltr',
      lv: 'ltr',
      mg: 'ltr',
      mh: 'ltr',
      mo: 'ltr',
      ms: 'ltr',
      mt: 'ltr',
      na: 'ltr',
      nb: 'ltr',
      nd: 'ltr',
      nl: 'ltr',
      nn: 'ltr',
      no: 'ltr',
      nr: 'ltr',
      ny: 'ltr',
      om: 'ltr',
      pl: 'ltr',
      pt: 'ltr',
      qu: 'ltr',
      rm: 'ltr',
      rn: 'ltr',
      ro: 'ltr',
      rw: 'ltr',
      sg: 'ltr',
      sk: 'ltr',
      sl: 'ltr',
      sm: 'ltr',
      so: 'ltr',
      sq: 'ltr',
      ss: 'ltr',
      st: 'ltr',
      sv: 'ltr',
      sw: 'ltr',
      tl: 'ltr',
      tn: 'ltr',
      to: 'ltr',
      tr: 'ltr',
      ts: 'ltr',
      ve: 'ltr',
      vi: 'ltr',
      xh: 'ltr',
      zu: 'ltr',
      ds: 'ltr',
      gs: 'ltr',
      hs: 'ltr',
      me: 'ltr',
      ni: 'ltr',
      ns: 'ltr',
      te: 'ltr',
      tk: 'ltr',
      tm: 'ltr',
      tp: 'ltr',
      tv: 'ltr',
      ml: 'ltr',
      my: 'ltr',
      nq: 'ltr',
      or: 'ltr',
      si: 'ltr',
      ta: 'ltr',
      dv: 'rtl',
      th: 'ltr',
      dz: 'ltr'
    };

    const getDirectionSymbol = dir => (dir === 'ltr') ? LRI : RLI;

    if (!['title', 'description'].includes(key) && !['titles', 'descriptions'].includes(source)) {
      return getDirectionSymbol(source[key].getDirection()) + source[key];
    }

    if (source === 'titles' || source === 'descriptions') {
      const dir = TABLE[key];
      if (dir) return getDirectionSymbol(dir) + source[key];
      return getDirectionSymbol('ltr') + source[key];
    }

    let direction;
    let lang;
    let context = jsonld['@context'];

    if (!Array.isArray(context)) {
      context = [context];
    }

    context.forEach(e => {
      if (typeof e === 'object') {
        if (e['@direction']) direction = e['@direction'];
        if (e['@language']) lang = e['@language'];
      }
    });

    if (key === 'title' || key === 'description') {
      if (direction) return getDirectionSymbol(direction) + source[key];
      if (lang) {
        const dir = TABLE[lang];
        if (dir) return getDirectionSymbol(dir) + source[key];
        return getDirectionSymbol('ltr') + source[key];
      }
    }

    return getDirectionSymbol(source[key].getDirection()) + source[key];
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
        const stringLimit = Math.floor(maxLabelWidth / 9);
        const d = (`${source[key]}`.length > stringLimit) ? {
          name: key,
          value: getDirectedValue(source, key).slice(0, stringLimit) + '...',
          valueExtended: getDirectedValue(source, key)
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
          return d.privChildren ? '#F5D76E' : 'white';
        } else {
          return d.privChildren ? '#86E2D5' : 'white';
        }
      })
      .on('mouseover', function (d) { if (d.valueExtended) tip.show(d); })
      .on('mouseout', tip.hide);

    nodeEnter.append('text')
      .attr('x', function (d) {
        const spacing = computeRadius(d) + 5;
        return d.children || d.privChildren ? -spacing : spacing;
      })
      .attr('dy', '4')
      .attr('text-anchor', function (d) { return d.children || d.privChildren ? 'end' : 'start'; })
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
          return d.privChildren ? '#F5D76E' : 'white';
        } else {
          return d.privChildren ? '#86E2D5' : 'white';
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
    if (d.children || d.privChildren) {
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
    } else if (n.privChildren) {
      n.privChildren.forEach(function (c) {
        num += numEndNodes(c);
      });
    } else {
      num++;
    }
    return num;
  }

  function click(d) {
    if (d.children) {
      d.privChildren = d.children;
      d.children = null;
    } else {
      d.children = d.privChildren;
      d.privChildren = null;
    }

    update(d);

    // fast-forward blank nodes
    if (d.children) {
      d.children.forEach(function (child) {
        if (child.isBlankNode && child.privChildren) {
          click(child);
        }
      });
    }
  }

  function collapse(d, toUpdate = false) {
    if (d.children) {
      d.privChildren = d.children;
      d.privChildren.forEach(child => collapse(child));
      d.children = null;

      if (toUpdate) {
        update(d);
      }
    }
  }

  function expand(d, toUpdate = false) {
    if (d.privChildren) {
      d.children = d.privChildren;
      d.children.forEach(child => expand(child));
      d.privChildren = null;
    } else if (d.children) {
      d.children.forEach(child => expand(child));
    }

    if (toUpdate) update(d);
  }

  update(root);

  document.getElementById('vis-collapse-all').addEventListener('click', _ => collapse(root, true));
  document.getElementById('vis-expand-all').addEventListener('click', _ => expand(root, true));
}
