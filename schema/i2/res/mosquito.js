
/**
 * Convert V3 TWC CC + V3 Location Info / IStar LFRecord to IStar 2 MosquitoActivity
 * @param {Object} input - V3 API CC Data as Json
 * @returns {}
 */
module.exports = function mosquito(objects) {
    return `
<Data type="MosquitoActivity">
${objects.join("\n")}
</Data>
    `
};