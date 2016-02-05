module.exports = {

  /**
   * Convert string or array strings to text value
   */
  convertText: function(value) {
    if (Array.isArray(value))
      return value.join('\n');
    return value;
  }
};
