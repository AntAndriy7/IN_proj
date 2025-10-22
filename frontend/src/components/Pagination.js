import React, { useMemo, useState, useEffect } from "react";
import "../styles/Home.css";

function Pagination({
                        data = [],
                        initialPerPage = 4,
                        onPageChange,
                        resetTrigger = 0
                    }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialPerPage);

    const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

    const currentData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage((prev) => {
            const newTotal = Math.ceil(data.length / itemsPerPage) || 1;
            return prev > newTotal ? 1 : prev;
        });
    }, [data.length, itemsPerPage]);

    useEffect(() => {
        if (onPageChange) onPageChange(currentData);
    }, [currentData, onPageChange]);

    useEffect(() => {
        setCurrentPage(1);
    }, [resetTrigger]);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="pagination-header">
            <div className="items-per-page">
                <span>Show:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                    {[4, 7, 10, 20].map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                </select>
                <span>per page</span>
            </div>

            <div className="page-info">
                Page {currentPage} of {totalPages}
            </div>

            <div className="page-buttons">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ← Prev
                </button>
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next →
                </button>
            </div>
        </div>
    );
}

export default Pagination;
