const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, VerticalAlign,
  UnderlineType
} = require('docx');
const fs = require('fs');
const path = require('path');

// Colors
const DARK_BLUE = "1A3A5C";
const MID_BLUE = "2E75B6";
const LIGHT_BLUE = "D6E4F0";
const ACCENT_GREEN = "1E8449";
const ACCENT_RED = "C0392B";
const LIGHT_GRAY = "F2F2F2";
const MEDIUM_GRAY = "BDBDBD";
const WHITE = "FFFFFF";
const DARK_TEXT = "1A1A2E";
const ORANGE = "E67E22";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: DARK_BLUE })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: MID_BLUE })]
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: DARK_BLUE })]
  });
}

function body(text, options = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 100 },
    alignment: options.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: "Arial", size: 22, color: DARK_TEXT, ...options.run })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: DARK_TEXT })]
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: DARK_TEXT })]
  });
}

function spacer(lines = 1) {
  const arr = [];
  for (let i = 0; i < lines; i++) arr.push(new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun("")] }));
  return arr;
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 1 } },
    children: [new TextRun("")]
  });
}

function infoBox(label, text, color = LIGHT_BLUE, labelColor = MID_BLUE) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1440, 7920],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 1440, type: WidthType.DXA },
            shading: { fill: labelColor, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: WHITE })]
            })]
          }),
          new TableCell({
            borders,
            width: { size: 7920, type: WidthType.DXA },
            shading: { fill: color, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 120 },
            children: [new Paragraph({
              children: [new TextRun({ text, font: "Arial", size: 21, color: DARK_TEXT })]
            })]
          })
        ]
      })
    ]
  });
}

function sectionBox(title, rows, headerColor = MID_BLUE) {
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          borders,
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: headerColor, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: WHITE })]
          })]
        })
      ]
    }),
    ...rows.map(([left, right]) => new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 3200, type: WidthType.DXA },
          shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: left, font: "Arial", size: 21, bold: true, color: DARK_BLUE })]
          })]
        }),
        new TableCell({
          borders,
          width: { size: 6160, type: WidthType.DXA },
          shading: { fill: WHITE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: right, font: "Arial", size: 21, color: DARK_TEXT })]
          })]
        })
      ]
    }))
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 6160],
    rows: tableRows
  });
}

function comparisonTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const tRows = [
    new TableRow({
      children: headers.map((h, i) => new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: WHITE })]
        })]
      }))
    }),
    ...rows.map((row, ri) => new TableRow({
      children: row.map((cell, ci) => new TableCell({
        borders,
        width: { size: colWidths[ci], type: WidthType.DXA },
        shading: { fill: ri % 2 === 0 ? WHITE : LIGHT_GRAY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.LEFT,
          children: [new TextRun({ text: cell, font: "Arial", size: 20, color: DARK_TEXT, bold: ci === 0 })]
        })]
      }))
    }))
  ];
  return new Table({ width: { size: totalWidth, type: WidthType.DXA }, columnWidths: colWidths, rows: tRows });
}

// ─── ASCII-art style diagrams using tables ───────────────────────────────────

function flowDiagramTable(steps) {
  // steps: array of {label, color, desc}
  const rows = [];
  steps.forEach((step, i) => {
    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 2200, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: []
        }),
        new TableCell({
          borders,
          width: { size: 5000, type: WidthType.DXA },
          shading: { fill: step.color || MID_BLUE, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: step.label, font: "Arial", size: 22, bold: true, color: WHITE })] }),
            ...(step.desc ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: step.desc, font: "Arial", size: 18, color: WHITE })] })] : [])
          ]
        }),
        new TableCell({ borders: noBorders, width: { size: 2160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [] })
      ]
    }));
    if (i < steps.length - 1) {
      rows.push(new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: 2200, type: WidthType.DXA }, children: [] }),
          new TableCell({
            borders: noBorders,
            width: { size: 5000, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 160, right: 160 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "▼", font: "Arial", size: 28, color: DARK_BLUE, bold: true })] })]
          }),
          new TableCell({ borders: noBorders, width: { size: 2160, type: WidthType.DXA }, children: [] })
        ]
      }));
    }
  });
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 5000, 2160], rows });
}

function architectureDiagram() {
  const makeCell = (text, fill, w, color = WHITE, bold = true) =>
    new TableCell({
      borders,
      width: { size: w, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 80, right: 80 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: "Arial", size: 19, bold, color })] })]
    });
  const makeEmptyCell = (w) => new TableCell({ borders: noBorders, width: { size: w, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("")] })] });
  const arrowCell = (w) => new TableCell({ borders: noBorders, width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "→", font: "Arial", size: 24, color: DARK_BLUE, bold: true })] })] });

  const downArrowRow = (colWidths) => new TableRow({
    children: colWidths.map((w, i) => {
      const isArrowCol = [0, 2, 4].includes(i);
      return new TableCell({
        borders: noBorders, width: { size: w, type: WidthType.DXA },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isArrowCol ? "↓" : "", font: "Arial", size: 22, color: DARK_BLUE, bold: true })] })]
      });
    })
  });

  const cw = [2200, 300, 2200, 300, 2200, 300, 2060];
  const totalW = cw.reduce((a, b) => a + b, 0);

  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: cw,
    rows: [
      // Row 1: Data Sources
      new TableRow({ children: [
        makeCell("Twitter API\n(Real-time)", ACCENT_GREEN, 2200),
        makeEmptyCell(300),
        makeCell("Streaming\nIngest Layer", MID_BLUE, 2200),
        makeEmptyCell(300),
        makeCell("Message Queue\n(Kafka/Kinesis)", ORANGE, 2200),
        makeEmptyCell(300),
        makeCell("Stream\nProcessor", DARK_BLUE, 2060)
      ]}),
      downArrowRow(cw),
      // Row 2: Processing
      new TableRow({ children: [
        makeCell("Hashtag\nFiltering", ACCENT_GREEN, 2200),
        makeEmptyCell(300),
        makeCell("Language\nDetection", MID_BLUE, 2200),
        makeEmptyCell(300),
        makeCell("NLP\nEngine", ORANGE, 2200),
        makeEmptyCell(300),
        makeCell("Sentiment\nScoring", DARK_BLUE, 2060)
      ]}),
      downArrowRow(cw),
      // Row 3: Output
      new TableRow({ children: [
        makeCell("Real-time\nDashboard", "2E4053", 2200),
        makeEmptyCell(300),
        makeCell("Alert\nSystem", "6C3483", 2200),
        makeEmptyCell(300),
        makeCell("Data\nWarehouse", "17202A", 2200),
        makeEmptyCell(300),
        makeCell("Reports &\nExports", "145A32", 2060)
      ]}),
    ]
  });
}

function sentimentScoreTable() {
  const data = [
    ["Score Range", "Category", "Label", "Example Action"],
    ["0.7 – 1.0", "Highly Positive 😊", "POSITIVE", "Promote, amplify campaign"],
    ["0.4 – 0.69", "Mildly Positive 🙂", "POSITIVE", "Engage and thank"],
    ["0.1 – 0.39", "Neutral 😐", "NEUTRAL", "Monitor for shifts"],
    ["-0.39 – -0.1", "Mildly Negative 😕", "NEGATIVE", "Customer support outreach"],
    ["-1.0 – -0.4", "Highly Negative 😠", "NEGATIVE", "Immediate crisis response"]
  ];
  const colWidths = [2000, 2400, 1760, 3200];
  const rows = data.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: {
        fill: ri === 0 ? DARK_BLUE : (ri === 1 ? "1A5276" : ri === 2 ? "1E8449" : ri === 3 ? LIGHT_GRAY : ri === 4 ? "FDECEA" : "FADBD8"),
        type: ShadingType.CLEAR
      },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: cell, font: "Arial", size: ri === 0 ? 20 : 19, bold: ri === 0, color: ri === 0 ? WHITE : (ri <= 2 ? (ri === 0 ? WHITE : WHITE) : DARK_TEXT) })]
      })]
    }))
  }));
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: colWidths, rows });
}

function filterPipelineTable() {
  const steps = [
    { stage: "Stage 1", name: "Language Filter", desc: "Remove non-English tweets", fill: MID_BLUE },
    { stage: "Stage 2", name: "Spam Detection", desc: "Remove bot-generated & duplicate tweets", fill: "8E44AD" },
    { stage: "Stage 3", name: "Relevance Filter", desc: "Check hashtags: #SmartPhoneX, #TechReview", fill: ACCENT_GREEN },
    { stage: "Stage 4", name: "Content Filter", desc: "Remove ads, retweets without original text", fill: ORANGE },
    { stage: "Stage 5", name: "Quality Filter", desc: "Discard tweets < 5 words or > 99% noise chars", fill: "2E4053" }
  ];
  const colWidths = [1400, 2600, 5360];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: [
        new TableCell({ borders, width: { size: 1400, type: WidthType.DXA }, shading: { fill: DARK_BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Stage", font: "Arial", size: 20, bold: true, color: WHITE })] })] }),
        new TableCell({ borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: DARK_BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Filter Type", font: "Arial", size: 20, bold: true, color: WHITE })] })] }),
        new TableCell({ borders, width: { size: 5360, type: WidthType.DXA }, shading: { fill: DARK_BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Action / Criteria", font: "Arial", size: 20, bold: true, color: WHITE })] })] })
      ]}),
      ...steps.map((s, i) => new TableRow({ children: [
        new TableCell({ borders, width: { size: 1400, type: WidthType.DXA }, shading: { fill: s.fill, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.stage, font: "Arial", size: 20, bold: true, color: WHITE })] })] }),
        new TableCell({ borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LIGHT_BLUE : WHITE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: s.name, font: "Arial", size: 20, bold: true, color: DARK_BLUE })] })] }),
        new TableCell({ borders, width: { size: 5360, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : LIGHT_GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: s.desc, font: "Arial", size: 20, color: DARK_TEXT })] })] })
      ]}))
    ]
  });
}

function vizTable() {
  const viz = [
    { name: "Real-Time Sentiment Gauge", type: "Radial Gauge / Speedometer", purpose: "Shows live positive vs negative ratio", best: "Executive dashboards, quick status" },
    { name: "Sentiment Timeline Chart", type: "Multi-line Time-Series", purpose: "Tracks sentiment changes over hours/days", best: "Trend analysis, campaign tracking" },
    { name: "Word Cloud", type: "Tag/Word Cloud", purpose: "Visualizes most frequent tweet words", best: "Topic discovery, hashtag monitoring" },
    { name: "Geo Heatmap", type: "Choropleth / Density Map", purpose: "Shows geographic sentiment distribution", best: "Regional analysis, market targeting" },
    { name: "Donut Chart", type: "Proportional Donut", purpose: "Overall positive/neutral/negative split", best: "Summary reports, presentations" },
    { name: "Trending Hashtag Bar Chart", type: "Horizontal Bar Chart", purpose: "Ranks top hashtags by frequency", best: "Campaign monitoring, influencer ID" },
    { name: "Emotion Radar Chart", type: "Spider / Radar Chart", purpose: "Maps emotions: joy, anger, fear, etc.", best: "Deep sentiment breakdown, PR teams" }
  ];
  const colWidths = [2200, 2000, 2800, 2360];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: ["Visualization", "Type", "Purpose", "Best Used For"].map((h, i) => new TableCell({ borders, width: { size: colWidths[i], type: WidthType.DXA }, shading: { fill: DARK_BLUE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, font: "Arial", size: 19, bold: true, color: WHITE })] })] })) }),
      ...viz.map((v, i) => new TableRow({ children: [v.name, v.type, v.purpose, v.best].map((cell, ci) => new TableCell({ borders, width: { size: colWidths[ci], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : LIGHT_GRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Arial", size: 19, color: DARK_TEXT, bold: ci === 0 })] })] })) }))
    ]
  });
}

// ─── BUILD DOCUMENT ───────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }, { level: 1, format: LevelFormat.BULLET, text: "○", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: DARK_BLUE }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: MID_BLUE }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } }
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1080, bottom: 1260, left: 1080 } }
    },
    headers: {
      default: new Header({
        children: [
          new Table({
            width: { size: 10080, type: WidthType.DXA },
            columnWidths: [7000, 3080],
            rows: [new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 7000, type: WidthType.DXA }, shading: { fill: DARK_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 200, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Twitter Sentiment Analysis — Case Study", font: "Arial", size: 20, bold: true, color: WHITE })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3080, type: WidthType.DXA }, shading: { fill: MID_BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 200 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Stream Data Mining", font: "Arial", size: 20, color: WHITE })] })] })
            ]})]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: MID_BLUE, space: 1 } },
            spacing: { before: 80 },
            children: [
              new TextRun({ text: "Confidential — Marketing Analytics Division   |   Page ", font: "Arial", size: 18, color: "666666" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "666666" })
            ]
          })
        ]
      })
    },
    children: [

      // ═══════════════ COVER PAGE ═══════════════
      new Paragraph({ spacing: { before: 600, after: 0 }, children: [new TextRun("")] }),

      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [10080],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          width: { size: 10080, type: WidthType.DXA },
          shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
          margins: { top: 400, bottom: 400, left: 400, right: 400 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "CASE STUDY REPORT", font: "Arial", size: 20, bold: true, color: "A9CCE3" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }, children: [new TextRun({ text: "Twitter Sentiment Analysis", font: "Arial", size: 52, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "Stream Data Mining for Real-Time Customer Intelligence", font: "Arial", size: 26, color: "A9CCE3" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 0 }, children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━", font: "Arial", size: 24, color: MID_BLUE })] }),
          ]
        })]
        })]
      }),

      ...spacer(1),

      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [3300, 3390, 3390],
        rows: [new TableRow({ children: [
          new TableCell({ borders, width: { size: 3300, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CLIENT", font: "Arial", size: 18, bold: true, color: MID_BLUE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Digital Marketing Agency", font: "Arial", size: 20, color: DARK_TEXT })] })
          ]}),
          new TableCell({ borders, width: { size: 3390, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DOMAIN", font: "Arial", size: 18, bold: true, color: MID_BLUE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Big Data / NLP", font: "Arial", size: 20, color: DARK_TEXT })] })
          ]}),
          new TableCell({ borders, width: { size: 3390, type: WidthType.DXA }, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PRODUCT", font: "Arial", size: 18, bold: true, color: MID_BLUE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SmartPhone X — Launch Campaign", font: "Arial", size: 20, color: DARK_TEXT })] })
          ]})
        ]})]
      }),

      ...spacer(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ EXECUTIVE SUMMARY ═══════════════
      heading1("Executive Summary"),
      divider(),
      body("This case study examines how a leading marketing company leveraged real-time Twitter data to monitor and analyze public sentiment for the newly launched SmartPhone X. With thousands of tweets being generated every minute using product-related hashtags, the challenge was to build a scalable, high-throughput data pipeline that could ingest, filter, analyze, and visualize customer opinions as they emerged on social media."),
      ...spacer(1),
      body("The solution employed a stream data mining architecture — a paradigm specifically designed to handle continuous, high-velocity data flows — to deliver actionable marketing intelligence in real time. This document answers four key analytical questions and provides a comprehensive blueprint for the system's design, methodology, and visualization strategy."),
      ...spacer(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [new TableRow({ children: [
          ["~6,000", "Tweets/Min", MID_BLUE],
          ["95%+", "Filter Accuracy", ACCENT_GREEN],
          ["<2 sec", "Latency", ORANGE],
          ["3 Layers", "Visualization", "6C3483"]
        ].map(([num, label, fill]) => new TableCell({
          borders,
          width: { size: 2340, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: num, font: "Arial", size: 36, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, font: "Arial", size: 20, color: WHITE })] })
          ]
        }))})]
      }),

      ...spacer(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 1 ═══════════════
      heading1("Section 1: Background and Problem Statement"),
      divider(),
      heading2("1.1 Company Overview"),
      body("The client is a mid-sized digital marketing agency specializing in consumer electronics product launches. With a portfolio of over 40 brand clients and an in-house analytics team of 12 data scientists, the agency had been relying on traditional batch-based social listening tools that provided insights only every 24 hours. For a high-stakes product launch like SmartPhone X, this latency was commercially unacceptable."),
      ...spacer(1),
      heading2("1.2 Business Problem"),
      body("When SmartPhone X hit the market, conversations exploded across Twitter. The company faced a critical operational gap: they could not respond to customer sentiment in real time. A negative review going viral could damage sales within hours, while a positive celebrity mention could be amplified for massive marketing gain — but only if the team knew about it within minutes, not days."),
      ...spacer(1),

      infoBox("Challenge", "Thousands of tweets per minute containing diverse hashtags needed to be sorted, scored for sentiment, and visualized — all within a 2-second processing window.", LIGHT_BLUE, MID_BLUE),
      ...spacer(1),

      heading2("1.3 Project Objectives"),
      bullet("Establish a real-time ingestion pipeline connected to the Twitter Streaming API"),
      bullet("Filter incoming tweets to retain only relevant, high-quality data"),
      bullet("Perform automated sentiment scoring using NLP (Natural Language Processing)"),
      bullet("Identify trending topics and keywords dynamically"),
      bullet("Deliver live dashboards and alert systems to marketing stakeholders"),
      ...spacer(1),

      heading2("1.4 Scope of Data"),
      sectionBox("Data Scope Summary", [
        ["Platform", "Twitter (X) — Public timeline and search API"],
        ["Keywords/Hashtags", "#SmartPhoneX, #NewPhone, #TechReview, #SmartPhoneXReview, #BestPhone2025"],
        ["Languages", "English (primary), Spanish, French (secondary with translation)"],
        ["Tweet Volume", "Approximately 4,000–8,000 tweets per minute during peak hours"],
        ["Time Window", "72-hour campaign monitoring window, extendable"],
        ["Data Points", "Tweet text, timestamp, user location, retweet count, likes, reply count"]
      ]),

      ...spacer(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 2 ═══════════════
      heading1("Section 2: Understanding Stream Data"),
      divider(),
      heading2("Question (a): Why Is This Dataset Considered Stream Data?"),
      ...spacer(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          shading: { fill: "FEF9E7", type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 200, right: 200 },
          children: [new Paragraph({ children: [new TextRun({ text: "Definition: Stream data is a continuous, unbounded sequence of data records that arrive at high velocity and must be processed incrementally, typically without the ability to store the entire dataset before analysis begins.", font: "Arial", size: 22, italics: true, color: DARK_BLUE })] })]
        })]
        })]
      }),
      ...spacer(1),

      heading2("2.1 Characteristics That Make Twitter Data a Stream"),
      body("The Twitter dataset in this case study exhibits all five defining properties of stream data:"),
      ...spacer(1),

      comparisonTable(
        ["Stream Property", "Twitter Data Evidence", "Impact"],
        [
          ["Continuous & Unbounded", "Tweets arrive 24/7 with no defined end point", "Cannot wait for full dataset — must process on-the-fly"],
          ["High Velocity", "4,000–8,000 tweets/min during peak product launch", "Requires parallel distributed processing"],
          ["Time-Ordered", "Each tweet carries a precise UTC timestamp", "Chronological ordering enables trend detection"],
          ["Unpredictable Volume", "Volume spikes 10x during celebrity mentions or news events", "System must auto-scale to handle surges"],
          ["Non-Repeatable", "Historical tweets cannot be fetched again via free API tier", "One-pass processing required; no second chances"],
          ["Heterogeneous Content", "Tweets contain text, emojis, slang, URLs, media", "Complex preprocessing pipeline needed"]
        ],
        [3000, 3480, 2880]
      ),
      ...spacer(1),

      heading2("2.2 Contrast: Stream Data vs. Batch Data"),
      body("To fully appreciate why stream data mining was chosen over traditional batch processing, the following comparison is instructive:"),
      ...spacer(1),

      comparisonTable(
        ["Dimension", "Batch Processing", "Stream Processing (This Project)"],
        [
          ["Data Access", "Entire dataset stored before processing", "Data processed as it arrives — one record at a time"],
          ["Latency", "Minutes to hours (or days)", "Milliseconds to seconds"],
          ["Storage Required", "Full dataset must fit in storage", "Only recent window needed in memory"],
          ["Query Type", "Complex historical queries", "Sliding window queries, real-time aggregations"],
          ["Use Case Fit", "End-of-day reports", "Live marketing dashboards, immediate crisis alerts"],
          ["Scalability", "Scales with storage", "Scales with compute nodes (horizontal)"]
        ],
        [2400, 3480, 3480]
      ),
      ...spacer(1),

      heading2("2.3 The Velocity Problem — Why It Matters"),
      body("Consider this scenario: SmartPhone X receives a one-star review from a tech influencer with 2 million followers at 2:14 PM. Within 3 minutes, over 800 retweets flood the platform amplifying the negative sentiment. With batch processing, the marketing team would see this data at the next day's report — by which time the damage is done. With stream processing, an alert fires at 2:15 PM, enabling an immediate public relations response."),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 3 ═══════════════
      heading1("Section 3: Stream Data Mining Techniques"),
      divider(),
      heading2("Question (b): How Stream Data Mining Techniques Analyze This Data"),
      ...spacer(1),
      body("Stream data mining is a branch of data mining specifically engineered for continuous, real-time data flows. Unlike traditional data mining, it operates under strict constraints: limited memory, single-pass processing, and time-bounded computation. The following techniques are applied in sequence to analyze SmartPhone X tweets."),
      ...spacer(1),

      heading2("3.1 System Architecture Overview"),
      body("The following diagram illustrates the end-to-end stream processing architecture deployed for this project:"),
      ...spacer(1),
      architectureDiagram(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "Figure 1: End-to-End Stream Processing Architecture", font: "Arial", size: 19, italics: true, color: "666666" })] }),
      ...spacer(1),

      heading2("3.2 Technique 1 — Sliding Window Processing"),
      body("Because the full Twitter stream cannot be stored in memory, sliding window algorithms analyze only the most recent time window of data. For this project, three window sizes are used simultaneously:"),
      ...spacer(1),
      comparisonTable(
        ["Window Type", "Duration", "Purpose"],
        [
          ["Tumbling Window", "1 minute", "Tweet volume count, spam spike detection"],
          ["Sliding Window", "15 minutes", "Sentiment trend tracking, moving average"],
          ["Session Window", "User session (30 min inactivity)", "Per-user sentiment journey mapping"]
        ],
        [3120, 3120, 3120]
      ),
      ...spacer(1),
      body("Each window is evaluated at its expiry. The system maintains running aggregations (counts, sums, averages) using in-memory structures, discarding raw tweet data once the window closes to conserve memory."),
      ...spacer(1),

      heading2("3.3 Technique 2 — Reservoir Sampling"),
      body("When tweet volume exceeds processing capacity, reservoir sampling provides a statistically representative sample of the stream. The algorithm guarantees that every tweet has an equal probability of being included in the sample — ensuring unbiased analysis even when only a subset is processed."),
      bullet("Reservoir size R = 10,000 tweets maintained in memory"),
      bullet("Each new tweet i replaces a random reservoir element with probability R/i"),
      bullet("Result: a statistically valid sample with O(R) memory regardless of stream size"),
      ...spacer(1),

      heading2("3.4 Technique 3 — Approximate Frequency Counting (Lossy Counting)"),
      body("The Lossy Counting algorithm identifies the most frequent hashtags and keywords in the stream without storing every item. It maintains a compact summary of frequently appearing items, guaranteeing that no frequent item is missed while providing approximate counts with bounded error."),
      ...spacer(1),

      infoBox("Example Output", "After 1 hour: #SmartPhoneX (count: 28,400), #CameraQuality (18,200), #BatteryLife (14,100), #Overpriced (9,800) — with error margin ≤ 0.1%.", LIGHT_BLUE, ACCENT_GREEN),
      ...spacer(1),

      heading2("3.5 Technique 4 — Real-Time Natural Language Processing (NLP)"),
      body("Each tweet passes through a multi-stage NLP pipeline that executes within 50 milliseconds per tweet:"),
      ...spacer(1),

      flowDiagramTable([
        { label: "Step 1: Text Preprocessing", desc: "Remove URLs, clean emojis, normalize slang", color: MID_BLUE },
        { label: "Step 2: Tokenization", desc: "Split text into individual words/tokens", color: "8E44AD" },
        { label: "Step 3: Stop Word Removal", desc: "Remove 'the', 'is', 'at', etc.", color: ACCENT_GREEN },
        { label: "Step 4: Sentiment Scoring", desc: "VADER / RoBERTa model assigns polarity score", color: ORANGE },
        { label: "Step 5: Entity Recognition", desc: "Extract product features, competitor names", color: DARK_BLUE }
      ]),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "Figure 2: Real-Time NLP Processing Pipeline", font: "Arial", size: 19, italics: true, color: "666666" })] }),
      ...spacer(1),

      heading2("3.6 Technique 5 — Online Machine Learning"),
      body("Unlike offline models trained once on historical data, online learning models update their parameters with each new data batch. For this project, an online Naive Bayes classifier and a stream-compatible version of Stochastic Gradient Descent (SGD) are deployed. These models continuously adapt to new slang, evolving hashtags, and shifting sentiment patterns without requiring full retraining."),
      ...spacer(1),

      heading2("3.7 Sentiment Scoring Framework"),
      body("Each tweet receives a compound sentiment score on a scale of -1.0 (most negative) to +1.0 (most positive). The scoring thresholds and corresponding business actions are defined as follows:"),
      ...spacer(1),
      sentimentScoreTable(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "Figure 3: Sentiment Scoring Framework and Business Response Matrix", font: "Arial", size: 19, italics: true, color: "666666" })] }),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 4 ═══════════════
      heading1("Section 4: Filtering the Twitter Stream"),
      divider(),
      heading2("Question (c): How Filtering Streams Removes Irrelevant Tweets"),
      ...spacer(1),
      body("Raw Twitter streams are notoriously noisy. Studies estimate that for any trending hashtag, as many as 40–60% of tweets may be irrelevant, duplicated, spam-generated, or otherwise unsuitable for sentiment analysis. A robust multi-stage filtering pipeline is therefore the most critical quality control mechanism in the system."),
      ...spacer(1),

      heading2("4.1 The Multi-Stage Filter Pipeline"),
      body("Tweets pass through five sequential filter stages before entering the NLP engine. Each stage independently rejects records, ensuring only clean, relevant data reaches the analysis layer:"),
      ...spacer(1),
      filterPipelineTable(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "Figure 4: Five-Stage Tweet Filter Pipeline", font: "Arial", size: 19, italics: true, color: "666666" })] }),
      ...spacer(1),

      heading2("4.2 Detailed Filter Mechanisms"),
      heading3("4.2.1 Language and Geographic Filters"),
      body("Twitter's API provides a lang parameter that pre-filters tweets by language code before transmission. Additionally, a geographic bounding box can be specified to target tweets from specific regions — for instance, limiting analysis to tweets from the target market countries of the smartphone launch (USA, UK, Australia, India)."),
      ...spacer(1),

      heading3("4.2.2 Bloom Filter for Duplicate Detection"),
      body("Retweets and copy-paste spam create significant duplication in the stream. A Bloom filter — a probabilistic data structure — maintains a compact hash representation of all recently seen tweet texts. When a new tweet arrives, it is hashed and checked against the Bloom filter:"),
      bullet("If the hash exists → tweet is flagged as probable duplicate and discarded"),
      bullet("If the hash is new → tweet is admitted and its hash is added to the filter"),
      bullet("Memory usage: a Bloom filter for 1 million tweets requires only ~1.2 MB at 1% false positive rate"),
      ...spacer(1),

      heading3("4.2.3 Bot and Spam Detection"),
      body("Automated bot accounts generate a disproportionate share of tweets during product launches — often artificially inflating sentiment scores. The system applies a composite bot-detection score based on multiple signals:"),
      ...spacer(1),

      comparisonTable(
        ["Signal", "Bot Indicator Threshold", "Weight"],
        [
          ["Account Age", "< 30 days old", "High"],
          ["Tweet Frequency", "> 50 tweets/hour", "High"],
          ["Follower/Following Ratio", "< 0.1 (many following, few followers)", "Medium"],
          ["Profile Completeness", "No profile photo, no bio", "Medium"],
          ["Tweet Similarity", "> 85% identical to other tweets", "High"],
          ["Default Profile", "Using Twitter's default egg avatar", "Low"]
        ],
        [3120, 3720, 2520]
      ),
      ...spacer(1),
      body("Accounts scoring above a composite threshold of 0.65 on the bot probability scale are automatically excluded from analysis. Borderline accounts (0.45–0.65) are tagged and monitored but not excluded, as some power users exhibit bot-like posting patterns during live events."),
      ...spacer(1),

      heading3("4.2.4 Semantic Relevance Filter"),
      body("Even tweets containing the target hashtag may be semantically irrelevant. A lightweight TF-IDF (Term Frequency-Inverse Document Frequency) relevance classifier checks whether the tweet body relates meaningfully to the smartphone product domain. Tweets about unrelated topics that happen to include the hashtag (a common spam technique) are rejected."),
      ...spacer(1),

      heading2("4.3 Filter Performance Metrics"),
      comparisonTable(
        ["Metric", "Target", "Achieved in Testing"],
        [
          ["Precision (Relevant Tweets Kept)", "> 92%", "94.7%"],
          ["Recall (Valid Tweets Not Lost)", "> 88%", "91.3%"],
          ["False Positive Rate (Good Tweets Rejected)", "< 8%", "5.3%"],
          ["Processing Latency per Tweet", "< 10ms", "7.2ms average"],
          ["Throughput", "10,000 tweets/sec", "12,400 tweets/sec"]
        ],
        [3600, 2880, 2880]
      ),
      ...spacer(1),

      heading2("4.4 Volume Impact of Filtering"),
      body("The filtering pipeline typically reduces raw tweet volume by 45–55%, transforming a noisy firehose into a clean, high-signal data stream that the NLP engine can process with confidence. For every 10,000 raw tweets ingested:"),
      bullet("~2,800 removed by language/geo filter (non-English or out-of-region)"),
      bullet("~1,400 removed by duplicate/retweet filter"),
      bullet("~900 removed by bot detection filter"),
      bullet("~300 removed by semantic relevance filter"),
      bullet("~4,600 clean tweets proceed to sentiment analysis"),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 5 ═══════════════
      heading1("Section 5: Visualization Techniques"),
      divider(),
      heading2("Question (d): Visualization Techniques to Present Sentiment Results"),
      ...spacer(1),
      body("Effective visualization transforms complex, high-dimensional sentiment data into actionable intelligence that marketing executives, PR teams, and product managers can interpret at a glance. The visualization strategy for this project operates across three distinct layers: real-time dashboards, analytical deep-dives, and automated reports."),
      ...spacer(1),

      heading2("5.1 Visualization Techniques Overview"),
      vizTable(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "Figure 5: Recommended Visualization Techniques and Use Cases", font: "Arial", size: 19, italics: true, color: "666666" })] }),
      ...spacer(1),

      heading2("5.2 Layer 1 — Real-Time Operational Dashboard"),
      body("The operational dashboard is designed for the social media monitoring team and refreshes every 30 seconds. It consists of five primary visual components arranged in a responsive grid:"),
      ...spacer(1),

      // Mock dashboard layout
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "1A5276", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "😊 POSITIVE", font: "Arial", size: 22, bold: true, color: WHITE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "62%", font: "Arial", size: 44, bold: true, color: "#5DADE2" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "▲ +4% vs last hour", font: "Arial", size: 18, color: "#A9CCE3" })] })
            ]}),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "145A32", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "😐 NEUTRAL", font: "Arial", size: 22, bold: true, color: WHITE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "23%", font: "Arial", size: 44, bold: true, color: "#82E0AA" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "▼ -1% vs last hour", font: "Arial", size: 18, color: "#A9DFBF" })] })
            ]}),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "78281F", type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "😠 NEGATIVE", font: "Arial", size: 22, bold: true, color: WHITE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "15%", font: "Arial", size: 44, bold: true, color: "#F1948A" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "▼ -3% vs last hour", font: "Arial", size: 18, color: "#F5B7B1" })] })
            ]})
          ]}),
          new TableRow({ children: [
            new TableCell({ columnSpan: 2, borders, width: { size: 6240, type: WidthType.DXA }, shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "📈 Sentiment Timeline (Last 2 Hours)", font: "Arial", size: 20, bold: true, color: DARK_BLUE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: "Time  2PM──────────────────────3PM──────────────────────4PM", font: "Arial", size: 16, color: MEDIUM_GRAY })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Positive ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  62%", font: "Arial", size: 17, color: MID_BLUE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Negative ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  15%", font: "Arial", size: 17, color: ACCENT_RED })] })
            ]}),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: LIGHT_GRAY, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "🔥 Top Hashtags", font: "Arial", size: 20, bold: true, color: DARK_BLUE })] }),
              ...["#SmartPhoneX ███████ 28K", "#CameraQuality █████ 18K", "#BatteryLife ████ 14K", "#Overpriced ███ 10K"].map(t => new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: t, font: "Courier New", size: 18, color: DARK_TEXT })] }))
            ]})
          ]})
        ]
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 160 }, children: [new TextRun({ text: "Figure 6: Real-Time Operational Dashboard Mock-Up", font: "Arial", size: 19, italics: true, color: "666666" })] }),
      ...spacer(1),

      heading2("5.3 Layer 2 — Analytical Deep-Dive Visuals"),
      body("The analytical layer provides deeper exploration for the data science team and campaign managers. These visuals update every 15 minutes and are accessible via the reporting portal:"),
      ...spacer(1),

      heading3("5.3.1 Geographic Sentiment Heatmap"),
      body("A choropleth map color-codes states or countries by their average sentiment score. Regions with high positive sentiment (dark green) indicate strong market reception, while regions with high negative sentiment (dark red) may require targeted customer service interventions or localized marketing adjustments. This visualization is particularly powerful for identifying geographic disparities — for example, if battery complaints dominate tweets from users in cold-climate regions."),
      ...spacer(1),

      heading3("5.3.2 Emotion Radar Chart"),
      body("Beyond simple positive/negative classification, the NLP pipeline extracts eight primary emotions (joy, trust, anticipation, surprise, anger, disgust, fear, sadness) from tweet text using the NRC Emotion Lexicon. A radar chart plots these eight dimensions simultaneously, providing a nuanced emotional fingerprint of public perception. Successive snapshots of this chart reveal how the emotional profile shifts during a product crisis versus a successful marketing event."),
      ...spacer(1),

      heading3("5.3.3 Sentiment Correlation Scatter Plot"),
      body("A scatter plot correlates tweet sentiment score (Y-axis) with the account's influence score, calculated from follower count and engagement rate (X-axis). This visualization helps the marketing team identify high-influence positive voices for potential brand ambassador outreach, and high-influence negative voices requiring immediate attention."),
      ...spacer(1),

      heading2("5.4 Layer 3 — Automated Alert System"),
      body("The alert system is not a visualization in the traditional sense, but it serves as the most actionable output layer. Configurable thresholds trigger automated notifications:"),
      ...spacer(1),

      comparisonTable(
        ["Alert Type", "Trigger Condition", "Delivery Channel", "Response Time"],
        [
          ["Sentiment Crash Alert", "Negative % > 35% in any 5-min window", "SMS + Slack + Email", "Immediate (< 60 sec)"],
          ["Viral Positive Alert", "Single tweet > 500 RTs in 10 minutes", "Slack + Dashboard pop-up", "< 2 minutes"],
          ["Bot Surge Alert", "Bot detection rate > 20% in 15 min window", "Email to security team", "< 5 minutes"],
          ["Competitor Mention Alert", "Competitor brand mentioned alongside hashtag", "Email to strategy team", "< 10 minutes"],
          ["Trending Topic Alert", "New hashtag enters top-10 suddenly", "Dashboard notification", "< 1 minute"]
        ],
        [2800, 2800, 1960, 1800]
      ),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 6 ═══════════════
      heading1("Section 6: Technology Stack and Implementation"),
      divider(),
      heading2("6.1 Recommended Technology Stack"),
      ...spacer(1),

      sectionBox("Complete Technology Stack", [
        ["Data Ingestion", "Twitter Filtered Stream API v2, Apache Kafka (message broker), AWS Kinesis Data Streams"],
        ["Stream Processing", "Apache Flink (primary), Apache Spark Structured Streaming (alternative), Python Streamz"],
        ["NLP & Sentiment", "VADER SentimentIntensityAnalyzer, HuggingFace RoBERTa (transformer-based), spaCy for NER"],
        ["Storage Layer", "Redis (real-time cache, sliding windows), Apache Cassandra (time-series storage), Amazon S3 (cold storage)"],
        ["Visualization", "Apache Superset (dashboards), D3.js (custom charts), Mapbox (geo heatmaps), Tableau (reports)"],
        ["Orchestration", "Apache Airflow (pipeline scheduling), Docker/Kubernetes (containerized deployment)"],
        ["Monitoring", "Prometheus + Grafana (pipeline health), PagerDuty (alert escalation), Datadog (APM)"]
      ]),
      ...spacer(1),

      heading2("6.2 Data Flow Sequence"),
      body("The following sequence describes the complete lifecycle of a single tweet from ingestion to visualization:"),
      ...spacer(1),

      numbered("Twitter API streams tweets matching keywords to the Kafka input topic in real time"),
      numbered("Kafka consumer groups distribute tweets across multiple Flink processing nodes"),
      numbered("Flink applies the five-stage filter pipeline, discarding irrelevant records"),
      numbered("Clean tweets are tokenized and scored by the VADER/RoBERTa sentiment model"),
      numbered("Scored records are aggregated using sliding window operations (1-min, 15-min)"),
      numbered("Window results are written to Redis for real-time dashboard queries"),
      numbered("Full scored records are persisted to Cassandra for historical trend analysis"),
      numbered("Dashboard queries Redis every 30 seconds to render updated visualizations"),
      numbered("Threshold breaches trigger alert rules, dispatching notifications via PagerDuty"),
      ...spacer(1),

      heading2("6.3 Scalability Considerations"),
      body("The architecture is designed for horizontal scalability. During peak periods (product launch events, viral moments), additional Flink task managers and Kafka partitions can be provisioned within 2–3 minutes using Kubernetes auto-scaling. The system has been load-tested to sustain 50,000 tweets per second — well beyond the typical Twitter firehose volume for a consumer product hashtag."),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 7 ═══════════════
      heading1("Section 7: Results, Insights, and Business Impact"),
      divider(),
      heading2("7.1 Key Findings from SmartPhone X Launch Campaign"),
      ...spacer(1),

      comparisonTable(
        ["Insight", "Finding", "Business Action Taken"],
        [
          ["Top Positive Theme", "Camera quality praised in 68% of positive tweets", "Launched 'Camera Challenge' social media campaign"],
          ["Top Negative Theme", "Battery drain complaints spike after 48 hours of launch", "Engineering hotfix released; proactive outreach to complainers"],
          ["Geographic Outlier", "Negative sentiment 2x higher in Canada vs USA", "Investigated — found retail pricing issue; corrected within 6 hours"],
          ["Influencer Opportunity", "Tech reviewer with 1.2M followers posted positive review", "Engaged for sponsored content deal within 3 hours"],
          ["Competitor Mention", "Competitor phone mentioned in 18% of negative tweets", "Competitive differentiation messaging developed"],
          ["Sentiment Peak Time", "Highest positive sentiment 8–10 PM local time", "Social media posting schedule optimized for evening hours"]
        ],
        [2600, 3880, 2880]
      ),
      ...spacer(1),

      heading2("7.2 ROI and Business Value"),
      body("The real-time sentiment monitoring system delivered measurable business value across multiple dimensions during the 72-hour launch window:"),
      bullet("The battery complaint crisis was identified and responded to 18 hours earlier than the previous (batch-based) system would have detected it, preventing an estimated 12,000 product returns"),
      bullet("The influencer engagement opportunity — identified within 3 hours of the positive review — resulted in a sponsored content deal worth $85,000 in earned media value"),
      bullet("Geographic pricing correction in Canada, made possible by the geo-sentiment heatmap, restored regional sales velocity within 24 hours"),
      bullet("Overall Net Promoter Score for the launch, as measured by sentiment analysis, reached +42 — significantly above the industry average of +28 for consumer electronics launches"),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ SECTION 8 ═══════════════
      heading1("Section 8: Challenges, Limitations, and Future Work"),
      divider(),
      heading2("8.1 Technical Challenges Encountered"),
      ...spacer(1),

      sectionBox("Challenge Log", [
        ["Sarcasm Detection", "NLP models consistently misclassify sarcastic tweets as positive. Requires fine-tuned transformer models with sarcasm-specific training data."],
        ["Emoji Ambiguity", "Emojis carry significant sentiment but with cultural variability. A 🙏 tweet may be grateful or desperate depending on context."],
        ["Slang Evolution", "New slang terms emerge daily during viral product moments. Static lexicons become outdated within days; online learning partially mitigates this."],
        ["API Rate Limits", "Twitter API v2 imposes rate limits that require careful management. Enterprise tier access recommended for high-volume campaigns."],
        ["Multilingual Content", "Despite English filtering, code-switching tweets (mixing English and other languages) bypass language filters and confuse the sentiment model."]
      ], "6C3483"),
      ...spacer(1),

      heading2("8.2 Ethical Considerations"),
      body("The collection and analysis of public social media data raises important ethical questions that the marketing agency has proactively addressed:"),
      bullet("All data is collected from public tweets only — no private messages or protected accounts are accessed"),
      bullet("Individual user identities are anonymized in all analytical outputs; only aggregate trends are shared with clients"),
      bullet("Bot detection results are used only to filter analysis data, not to report or penalize individual accounts"),
      bullet("The system complies with Twitter's Developer Agreement and GDPR data processing requirements"),
      ...spacer(1),

      heading2("8.3 Future Enhancements"),
      bullet("Multimodal Sentiment Analysis: Extend NLP to analyze images and videos embedded in tweets, as visual content increasingly drives engagement"),
      bullet("Cross-Platform Integration: Expand ingestion to include Reddit, Instagram comments, and YouTube descriptions for holistic brand monitoring"),
      bullet("Predictive Sentiment Modeling: Train time-series forecasting models (LSTM/Transformer) to predict sentiment trajectory 2–4 hours ahead"),
      bullet("Competitive Intelligence: Automatically benchmark SmartPhone X sentiment against competitor hashtags in real time"),
      bullet("Conversational AI Integration: Feed sentiment insights directly into a customer service chatbot to personalize responses based on tweet tone"),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ CONCLUSION ═══════════════
      heading1("Section 9: Conclusion"),
      divider(),
      body("This case study has demonstrated that the Twitter data generated during SmartPhone X's product launch constitutes a canonical example of stream data — continuous, high-velocity, time-ordered, and unbounded. Traditional batch processing approaches are fundamentally incompatible with the speed at which social media conversations evolve and the urgency with which marketing teams must respond."),
      ...spacer(1),
      body("Stream data mining techniques — including sliding window processing, Bloom filter deduplication, approximate frequency counting, online NLP, and adaptive machine learning — collectively provide a robust analytical framework that operates at the pace of social media itself. The five-stage filtering pipeline transforms a noisy, spam-laden raw stream into a clean, high-signal dataset with greater than 94% precision."),
      ...spacer(1),
      body("The layered visualization strategy — combining real-time operational dashboards, analytical deep-dive visuals, and automated alert systems — ensures that insights are delivered to the right stakeholders in the right format at the right time. The measurable business outcomes achieved during the SmartPhone X launch — from crisis prevention to influencer engagement and geographic market correction — validate the substantial investment in real-time stream analytics infrastructure."),
      ...spacer(1),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
          margins: { top: 200, bottom: 200, left: 240, right: 240 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Key Takeaway", font: "Arial", size: 22, bold: true, color: "#A9CCE3" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: "In the social media era, competitive advantage belongs to the brand that listens and responds at the speed of conversation. Stream data mining is not merely a technical solution — it is a strategic capability that transforms millions of unstructured data points into real-time business intelligence.", font: "Arial", size: 22, italics: true, color: WHITE })] })
          ]
        })]
        })]
      }),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════ REFERENCES ═══════════════
      heading1("References and Further Reading"),
      divider(),
      body("Aggarwal, C. C. (2007). Data Streams: Models and Algorithms. Springer. — Foundational textbook on stream data mining algorithms and theory."),
      ...spacer(1),
      body("Manku, G. S., & Motwani, R. (2002). Approximate Frequency Counts over Data Streams. Proceedings of the 28th VLDB Conference. — Original paper on Lossy Counting algorithm applied in Section 3.4."),
      ...spacer(1),
      body("Hutto, C. J., & Gilbert, E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. ICWSM-14. — Core sentiment analysis methodology."),
      ...spacer(1),
      body("Twitter Developer Platform. (2024). Filtered Stream API v2 Documentation. developer.twitter.com. — Technical reference for real-time tweet ingestion."),
      ...spacer(1),
      body("Apache Software Foundation. (2024). Apache Flink — Stateful Computations over Data Streams. flink.apache.org. — Stream processing framework documentation."),
      ...spacer(1),
      body("Bloom, B. H. (1970). Space/Time Trade-offs in Hash Coding with Allowable Errors. Communications of the ACM, 13(7), 422–426. — Original Bloom filter paper referenced in Section 4.2.2."),
      ...spacer(1),
      body("Mohammad, S. M., & Turney, P. D. (2013). Crowdsourcing a Word-Emotion Association Lexicon. Computational Intelligence, 29(3), 436–465. — NRC Emotion Lexicon used in radar chart visualization."),
      ...spacer(1),

      divider(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 0 }, children: [new TextRun({ text: "End of Case Study Report", font: "Arial", size: 20, bold: true, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 0 }, children: [new TextRun({ text: "Twitter Sentiment Analysis | Stream Data Mining | SmartPhone X Campaign", font: "Arial", size: 18, color: MEDIUM_GRAY })] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(path.join(__dirname, 'twitter_sentiment_case_study.docx'), buffer);
  console.log('Done! Saved to ' + path.join(__dirname, 'twitter_sentiment_case_study.docx'));
}).catch(err => {
  console.error(err);
  process.exit(1);
});
