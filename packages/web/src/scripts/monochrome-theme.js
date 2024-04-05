/* 
 *  Copyright (c) 2023 Contributors to the Eclipse Foundation
 *  
 *  See the NOTICE file(s) distributed with this work for additional
 *  information regarding copyright ownership.
 *  
 *  This program and the accompanying materials are made available under the
 *  terms of the Eclipse Public License v. 2.0 which is available at
 *  http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *  Document License (2015-05-13) which is available at
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *  
 *  SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

const themeData = {
    "base": "vs-dark",
    "inherit": true,
    "rules": [
      { 'token': '', 'foreground': 'ffffff', 'background': '549087' },
      { 'token': 'invalid', 'foreground': 'f44747' },
      { 'token': 'emphasis', 'fontStyle': 'italic' },
      { 'token': 'strong', 'fontStyle': 'bold' },
  
      { 'token': 'variable', 'foreground': 'ffbb00' },
      { 'token': 'variable.predefined', 'foreground': 'ffbb00' },
      { 'token': 'variable.parameter', 'foreground': 'ffbb00' },
      { 'token': 'constant', 'foreground': 'ffbb00' },
      { 'token': 'comment', 'foreground': '7b2d8a' },
      { 'token': 'number', 'foreground': 'fffffe' },
      { 'token': 'number.hex', 'foreground': 'fffffe' },
      { 'token': 'regexp', 'foreground': 'be3989' },
      { 'token': 'annotation', 'foreground': 'cc6666' },
      { 'token': 'type', 'foreground': '00fcce' },
  
      { token: 'delimiter', foreground: 'ffffff' },
      { token: 'delimiter.html', foreground: '808080' },
      { token: 'delimiter.xml', foreground: '808080' },
  
      { token: 'tag', foreground: '7b2d8a' },
      { token: 'tag.id.pug', foreground: '7b2d8a' },
      { token: 'tag.class.pug', foreground: '7b2d8a' },
      { token: 'meta.scss', foreground: 'A79873' },
      { token: 'meta.tag', foreground: 'd1744f' },
      { token: 'metatag', foreground: 'DD6A6F' },
      { token: 'metatag.content.html', foreground: 'ffbb00' },
      { token: 'metatag.html', foreground: 'ffbb00' },
      { token: 'metatag.xml', foreground: 'ffbb00' },
      { token: 'metatag.php', fontStyle: 'bold' },
  
      { token: 'key', foreground: 'ffbb00' },
      { token: 'string.key.json', foreground: 'ffbb00' },
      { token: 'string.value.json', foreground: 'd06c44' },
  
      { token: 'attribute.name', foreground: 'ffbb00' },
      { token: 'attribute.value', foreground: 'd06c44' },
      { token: 'attribute.value.number.css', foreground: '6ca74c' },
      { token: 'attribute.value.unit.css', foreground: '6ca74c' },
      { token: 'attribute.value.hex.css', foreground: 'D4D4D4' },
  
      { token: 'string', foreground: 'd06c44' },
      { token: 'string.sql', foreground: 'FF0000' },
  
      { token: 'keyword', foreground: 'ffbb00' },
      { token: 'keyword.flow', foreground: 'b33ea9' },
      { token: 'keyword.json', foreground: 'd06c44' },
      { token: 'keyword.flow.scss', foreground: 'ffbb00' },
  
      { token: 'operator.scss', foreground: '909090' },
      { token: 'operator.sql', foreground: 'ffbb00' },
      { token: 'operator.swift', foreground: '909090' },
      { token: 'predefined.sql', foreground: 'FF00FF' },
    ],
    "colors": {
      "editor.foreground": "#FFFFFF",
      "editor.background": "#549087",
      "editor.selectionBackground": "#73597EE0",
      "editor.lineHighlightBackground": "#067362",
      "editorCursor.foreground": "#FFFFFF"
    } 
}

export default themeData