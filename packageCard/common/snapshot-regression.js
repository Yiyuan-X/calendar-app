const graphemeUtils = require('./grapheme-utils');

function textBlock(id, text, patch) {
  return Object.assign({
    id,
    type: 'text',
    x: 80,
    y: 120,
    width: 520,
    height: 220,
    rotation: 0,
    lineHeight: 1.6,
    letterSpacing: 0,
    align: 'left',
    delta: { ops: [{ insert: text, attributes: { fontSize: 36, size: 36 } }] }
  }, patch || {});
}

function createSnapshotCases() {
  return [
    {
      id: 'emoji-grapheme',
      description: 'Emoji, skin tone, ZWJ, flag grapheme boundaries',
      design: { size: { width: 750, height: 1000 }, blocks: [textBlock('emoji', 'a👨‍👩‍👧‍👦👍🏽é🇨🇳')] },
      assert(design) {
        const text = design.blocks[0].delta.ops[0].insert;
        return graphemeUtils.splitGraphemes(text).length === 5;
      }
    },
    {
      id: 'mixed-language',
      description: 'Chinese English punctuation mixed line break',
      design: { size: { width: 750, height: 1000 }, blocks: [textBlock('mixed', '春风 hello world，emoji 😀 end')] }
    },
    {
      id: 'custom-font',
      description: 'Custom font metadata survives render/export',
      design: { size: { width: 750, height: 1000 }, blocks: [textBlock('font', 'Custom font text', { fontFamily: 'CardInter', fontUrl: 'mock://font.woff2' })] }
    },
    {
      id: 'rotate',
      description: 'Rotated text transform stability',
      design: { size: { width: 750, height: 1000 }, blocks: [textBlock('rotate', 'Rotate 😀 text', { rotation: 30 })] }
    },
    {
      id: 'multiline',
      description: 'Manual newline and auto wrap',
      design: { size: { width: 750, height: 1000 }, blocks: [textBlock('multi', '第一行😀\nSecond line with long text and emoji 👍🏽')] }
    },
    {
      id: 'selection-consistency',
      description: 'Selection-safe grapheme text',
      design: { size: { width: 750, height: 1000 }, blocks: [textBlock('select', 'A😀B👨‍👩‍👧‍👦C')] },
      assert(design) {
        const text = design.blocks[0].delta.ops[0].insert;
        return graphemeUtils.graphemeIndexToCodeUnitOffset(text, 2) === 3;
      }
    }
  ];
}

module.exports = {
  createSnapshotCases
};
