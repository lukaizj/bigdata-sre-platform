/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Human-readable format (e.g., "1.50 GB")
 */
function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(abs) / Math.log(1024));
  return sign + (abs / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

module.exports = {
  formatBytes,
};