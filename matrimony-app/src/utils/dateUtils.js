/**
 * Formats a date string to YYYY-MM-DD
 * Used for storing and input consistency
 * @param {string|Date} date 
 * @returns {string} YYYY-MM-DD
 */
export const formatDateToISO = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Formats a date string to a user-friendly format (DD/MM/YYYY)
 * @param {string|Date} date 
 * @returns {string} DD/MM/YYYY
 */
export const formatDateToDisplay = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
};

/**
 * Calculates age from a date of birth
 * @param {string|Date} dob 
 * @returns {number|string} age or 'N/A'
 */
export const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 'N/A';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

/**
 * Calculates human readable relative time based on last active timestamp
 * @param {string|Date} date 
 * @returns {string} Human readable elapsed time
 */
export const formatLastActive = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    if (isNaN(diff)) return '';

    const minutes = Math.floor(diff / 60000);

    if (minutes < 5) return "Active now";
    if (minutes < 60) return `Active ${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Active ${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return `Active yesterday`;
    return `Active ${days} days ago`;
};
