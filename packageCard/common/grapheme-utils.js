function fallbackSplitGraphemes(text) {
  var value = String(text || '');
  var result = [];
  var i = 0;

  function isHighSurrogate(code) {
    return code >= 0xD800 && code <= 0xDBFF;
  }

  function isLowSurrogate(code) {
    return code >= 0xDC00 && code <= 0xDFFF;
  }

  function codePointAt(index) {
    return value.codePointAt(index);
  }

  function isCombiningMark(cp) {
    return (cp >= 0x0300 && cp <= 0x036F) ||
      (cp >= 0x1AB0 && cp <= 0x1AFF) ||
      (cp >= 0x1DC0 && cp <= 0x1DFF) ||
      (cp >= 0x20D0 && cp <= 0x20FF) ||
      (cp >= 0xFE20 && cp <= 0xFE2F);
  }

  function isVariationSelector(cp) {
    return (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xE0100 && cp <= 0xE01EF);
  }

  function isSkinTone(cp) {
    return cp >= 0x1F3FB && cp <= 0x1F3FF;
  }

  while (i < value.length) {
    var start = i;
    var first = value.charCodeAt(i);
    i += isHighSurrogate(first) && i + 1 < value.length && isLowSurrogate(value.charCodeAt(i + 1)) ? 2 : 1;

    while (i < value.length) {
      var cp = codePointAt(i);
      var unitLength = cp > 0xFFFF ? 2 : 1;
      if (isCombiningMark(cp) || isVariationSelector(cp) || isSkinTone(cp)) {
        i += unitLength;
        continue;
      }
      if (cp === 0x200D && i + unitLength < value.length) {
        i += unitLength;
        var next = value.charCodeAt(i);
        i += isHighSurrogate(next) && i + 1 < value.length && isLowSurrogate(value.charCodeAt(i + 1)) ? 2 : 1;
        continue;
      }
      break;
    }
    result.push(value.slice(start, i));
  }
  return result;
}

function splitGraphemes(text) {
  var value = String(text || '');
  if (!value) return [];
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      var segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(value), function(part) { return part.segment; });
    }
  } catch (e) {}
  return fallbackSplitGraphemes(value);
}

function getGraphemeOffsets(text) {
  var offset = 0;
  return splitGraphemes(text).map(function(grapheme, index) {
    var start = offset;
    offset += grapheme.length;
    return {
      index: index,
      start: start,
      end: offset,
      text: grapheme
    };
  });
}

function sliceGraphemes(text, start, end) {
  var list = splitGraphemes(text);
  var safeStart = Math.max(0, Math.min(Number(start || 0), list.length));
  var safeEnd = typeof end === 'number' ? Math.max(safeStart, Math.min(end, list.length)) : list.length;
  return list.slice(safeStart, safeEnd).join('');
}

function codeUnitToGraphemeIndex(text, offset, affinity) {
  var value = String(text || '');
  var target = Math.max(0, Math.min(Number(offset || 0), value.length));
  var graphemes = getGraphemeOffsets(value);
  if (!graphemes.length) return 0;
  for (var i = 0; i < graphemes.length; i++) {
    var item = graphemes[i];
    if (target <= item.start) return i;
    if (target < item.end) {
      if (affinity === 'forward') return i + 1;
      if (affinity === 'nearest') return target - item.start < item.end - target ? i : i + 1;
      return i;
    }
  }
  return graphemes.length;
}

function graphemeIndexToCodeUnitOffset(text, index) {
  var graphemes = getGraphemeOffsets(text);
  var safe = Math.max(0, Math.min(Number(index || 0), graphemes.length));
  if (safe >= graphemes.length) return String(text || '').length;
  return graphemes[safe].start;
}

function snapCodeUnitOffset(text, offset, affinity) {
  return graphemeIndexToCodeUnitOffset(text, codeUnitToGraphemeIndex(text, offset, affinity || 'nearest'));
}

module.exports = {
  splitGraphemes: splitGraphemes,
  getGraphemeOffsets: getGraphemeOffsets,
  sliceGraphemes: sliceGraphemes,
  codeUnitToGraphemeIndex: codeUnitToGraphemeIndex,
  graphemeIndexToCodeUnitOffset: graphemeIndexToCodeUnitOffset,
  snapCodeUnitOffset: snapCodeUnitOffset
};
