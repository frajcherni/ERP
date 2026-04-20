import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const Pagination = ({ data, currentPage, setCurrentPage, perPageData, setPerPageData, showingText }: any) => {

    const handleClick = (e: any) => {
        setCurrentPage(e);
    };

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(data?.length / perPageData); i++) {
        pageNumbers.push(i);
    }
    const handleprevPage = () => {
        let prevPage = currentPage - 1;
        setCurrentPage(prevPage);
    };
    const handlenextPage = () => {
        let nextPage = currentPage + 1;
        setCurrentPage(nextPage);
    };

    useEffect(() => {
        if (pageNumbers.length && pageNumbers.length < currentPage) {
            setCurrentPage(pageNumbers.length || 1)
        }
    }, [pageNumbers.length, currentPage, setCurrentPage])

    return (
        <React.Fragment>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                {showingText && (
                    <div className="text-muted flex-grow-1">
                        {showingText}
                    </div>
                )}
                
                <div className="d-flex align-items-center flex-wrap gap-3">
                    {setPerPageData && (
                        <div className="d-flex align-items-center">
                            <span className="text-muted text-nowrap me-2">Show:</span>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: "auto" }}
                                value={perPageData}
                                onChange={e => {
                                    setPerPageData(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50, 100].map(num => (
                                    <option key={num} value={num}>
                                        {num}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="pagination-block pagination pagination-separated justify-content-center justify-content-sm-end mb-sm-0">
                        <ul className="pagination mb-0">
                            {currentPage <= 1 ? (
                                <li className="page-item disabled">
                                    <Link className="page-link pagination-prev" to="#!">
                                        Previous
                                    </Link>
                                </li>
                            ) :
                                <li className="page-item">
                                    <Link to="#!" className="page-link" onClick={handleprevPage}>Previous</Link>
                                </li>
                            }
                            {pageNumbers.map((item, key) => (
                                <li className="page-item" key={key}>
                                    <Link to="#!" className={currentPage === item ? "page-link active" : "page-link"} onClick={() => handleClick(item)}>{item}</Link>
                                </li>
                            ))}
                            {currentPage >= pageNumbers.length ? (
                                <li className="page-item disabled">
                                    <Link className="page-link pagination-next" to="#!">
                                        Next
                                    </Link>
                                </li>
                            ) :
                                <li className="page-item">
                                    <Link to="#!" className="page-link" onClick={handlenextPage}>Next</Link>
                                </li>
                            }
                        </ul>
                    </div>

                    <div className="d-flex align-items-center">
                        <span className="text-muted text-nowrap me-2">Go to page:</span>
                        <input
                            type="number"
                            min="1"
                            max={pageNumbers.length}
                            defaultValue={currentPage}
                            onChange={e => {
                                const page = e.target.value ? Number(e.target.value) : 1;
                                setCurrentPage(Math.max(1, Math.min(page, pageNumbers.length)));
                            }}
                            className="form-control form-control-sm"
                            style={{ width: '70px' }}
                        />
                        <span className="text-muted ms-2 text-nowrap">of {pageNumbers.length}</span>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Pagination;
