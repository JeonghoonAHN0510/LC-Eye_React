import { useEffect, useState } from "react";
import axios from "axios";
import "../../../assets/css/ProjectResult.css";
import { Pagination } from "@mui/material";
import { Select, Option } from "@mui/joy";
import ProjectListTable from "./ProjectListTable.jsx";
import { useLoading } from "../../contexts/LoadingContext.jsx";

export default function ProjectResult(props) {
    const { pjno, isOpen } = props;
    const { showLoading, hideLoading } = useLoading();

    const [lciInputData, setLciInputData] = useState([]);
    const [lciOutputData, setLciOutputData] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(100);

    const [inputPage, setInputPage] = useState(1);
    const [outputPage, setOutputPage] = useState(1);
    const [inputPageInput, setInputPageInput] = useState("1");
    const [outputPageInput, setOutputPageInput] = useState("1");

    // LCI 데이터 조회 ================================================
    const readLCI = async (pjnoParam) => {
        if (!pjnoParam) return;
        const loadingId = showLoading("로딩중입니다.");
        try {
            const res = await axios.get("http://localhost:8081/api/lci", {
                params: { pjno: pjnoParam },
                withCredentials: true,
            });

            const inputListRaw = Array.isArray(res?.data?.inputList)
                ? res.data.inputList
                : [];
            const outputListRaw = Array.isArray(res?.data?.outputList)
                ? res.data.outputList
                : [];

            
            const sortByFnameAsc = (arr) =>
                [...arr].sort((a, b) =>
                    String(a?.fname ?? "").localeCompare(String(b?.fname ?? ""))
                );

            const inputList = sortByFnameAsc(inputListRaw);
            const outputList = sortByFnameAsc(outputListRaw);

            setLciInputData(inputList);
            setLciOutputData(outputList);

            setInputPage(1);
            setOutputPage(1);
            setInputPageInput("1");
            setOutputPageInput("1");
        } catch (error) {
            console.error("[readLCI error]", error);
            setLciInputData([]);
            setLciOutputData([]);
        } finally {
            hideLoading(loadingId);
        }
    }; // func end

    // pjno 변경 시 LCI 데이터 재조회 ==================================
    useEffect(() => {
        if (isOpen && pjno) {
            readLCI(pjno);
        }
    }, [isOpen, pjno]);

    // 페이징 처리 ===================================================
    const totalInputPages =
        rowsPerPage > 0 && lciInputData.length > 0
            ? Math.ceil(lciInputData.length / rowsPerPage)
            : 1;
    const totalOutputPages =
        rowsPerPage > 0 && lciOutputData.length > 0
            ? Math.ceil(lciOutputData.length / rowsPerPage)
            : 1;

    // 페이지 번호가 총 페이지 수를 넘지 않도록 조정
    useEffect(() => {
        if (inputPage > totalInputPages) {
            const next = totalInputPages || 1;
            setInputPage(next);
            setInputPageInput(String(next));
        }
    }, [totalInputPages, inputPage]);

    useEffect(() => {
        if (outputPage > totalOutputPages) {
            const next = totalOutputPages || 1;
            setOutputPage(next);
            setOutputPageInput(String(next));
        }
    }, [totalOutputPages, outputPage]);

    const inputStartIndex = (inputPage - 1) * rowsPerPage;
    const inputEndIndex = inputStartIndex + rowsPerPage;
    const outputStartIndex = (outputPage - 1) * rowsPerPage;
    const outputEndIndex = outputStartIndex + rowsPerPage;

    const paginatedInputData = lciInputData.slice(
        inputStartIndex,
        inputEndIndex
    );
    const paginatedOutputData = lciOutputData.slice(
        outputStartIndex,
        outputEndIndex
    );

    // amount 값 포맷 함수 ===================================================
    const formatAmount = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return value ?? "";
        if (num === 0) return "0.000e+00";
        return num.toExponential(3); // 지수 표기법으로 변환
    };

    // 페이지 전체 데이터 index 번호 부여 + amount 포맷 ===================================================
    const inputRowsWithNo = paginatedInputData.map((item, idx) => ({
        ...item,
        no: inputStartIndex + idx + 1,
        amount: formatAmount(item.amount),
    }));
    const outputRowsWithNo = paginatedOutputData.map((item, idx) => ({
        ...item,
        no: outputStartIndex + idx + 1,
        amount: formatAmount(item.amount),
    }));

    // 페이지 번호 클램프 함수 ===================================================
    const clampPage = (page, total) => {
        if (!total || total < 1) return 1;
        if (!page || Number.isNaN(page)) return 1;
        return Math.min(Math.max(page, 1), total);
    };

    // 페이지 점프 함수 ===================================================
    const handleJumpPage = (target) => {
        if (target === "input") {
            const value = inputPageInput.trim();
            if (!value) return;
            const num = parseInt(value, 10);
            if (Number.isNaN(num)) return;
            const page = clampPage(num, totalInputPages);
            setInputPage(page);
            setInputPageInput(String(page));
        } else if (target === "output") {
            const value = outputPageInput.trim();
            if (!value) return;
            const num = parseInt(value, 10);
            if (Number.isNaN(num)) return;
            const page = clampPage(num, totalOutputPages);
            setOutputPage(page);
            setOutputPageInput(String(page));
        }
    };

    // return =======================================================
    return (
        <>
            <div className="projectResultTopBar">
                <div>조회 행 수</div>
                <div style={{ width: "10rem" }}>
                    <Select
                        value={String(rowsPerPage)}
                        onChange={(_, newValue) => {
                            if (!newValue) return;
                            const next = parseInt(newValue, 10);
                            if (Number.isNaN(next) || next <= 0) return;
                            setRowsPerPage(next);

                            setInputPage(1);
                            setOutputPage(1);
                            setInputPageInput("1");
                            setOutputPageInput("1");
                        }}
                    >
                        <Option value="100">100개</Option>
                        <Option value="150">150개</Option>
                        <Option value="200">200개</Option>
                    </Select>
                </div>
            </div>
            <div className="projectResultBox">
                <div className="inputResultBox">
                    <div className="resultTitle">Input</div>
                    <ProjectListTable
                        columns={[
                            { id: "no", title: "No", width: 60 },
                            { id: "fname", title: "항목명", width: 100 },
                            { id: "amount", title: "양", width: 100 },
                            { id: "uname", title: "단위", width: 60 },
                        ]}
                        data={
                            inputRowsWithNo && inputRowsWithNo.length > 0
                                ? inputRowsWithNo
                                : [{ __empty: true }]
                        }
                        rememberKey="ProjectResultInputTable"
                        sortable={false}
                        stickyFirst={false}
                    />
                    {totalInputPages > 1 && (
                        <div className="projectResultPagination">
                            <Pagination
                                count={totalInputPages}
                                page={inputPage}
                                onChange={(_, page) => {
                                    setInputPage(page);
                                    setInputPageInput(String(page));
                                }}
                                siblingCount={1}
                                boundaryCount={1}
                                showFirstButton
                                showLastButton
                                size="small"
                            />
                            <div className="projectResultPaginationControl">
                                <input
                                    type="number"
                                    min={1}
                                    max={totalInputPages}
                                    value={inputPageInput}
                                    onChange={(e) => {
                                        const onlyNumber = e.target.value.replace(
                                            /[^0-9]/g,
                                            ""
                                        );
                                        setInputPageInput(onlyNumber);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleJumpPage("input");
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="page-jump-button"
                                    onClick={() => handleJumpPage("input")}
                                >
                                    이동
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="outputResultBox">
                    <div className="resultTitle">Output</div>
                    <ProjectListTable
                        columns={[
                            { id: "no", title: "No", width: 60 },
                            { id: "fname", title: "항목명", width: 100 },
                            { id: "amount", title: "양", width: 100 },
                            { id: "uname", title: "단위", width: 60 },
                        ]}
                        data={
                            outputRowsWithNo && outputRowsWithNo.length > 0
                                ? outputRowsWithNo
                                : [{ __empty: true }]
                        }
                        rememberKey="ProjectResultOutputTable"
                        sortable={false}
                        stickyFirst={false}
                    />
                    {totalOutputPages > 1 && (
                        <div className="projectResultPagination">
                            <Pagination
                                count={totalOutputPages}
                                page={outputPage}
                                onChange={(_, page) => {
                                    setOutputPage(page);
                                    setOutputPageInput(String(page));
                                }}
                                siblingCount={1}
                                boundaryCount={1}
                                showFirstButton
                                showLastButton
                                size="small"
                            />
                            <div className="projectResultPaginationControl">
                                <input
                                    type="number"
                                    min={1}
                                    max={totalOutputPages}
                                    value={outputPageInput}
                                    onChange={(e) => {
                                        const onlyNumber = e.target.value.replace(
                                            /[^0-9]/g,
                                            ""
                                        );
                                        setOutputPageInput(onlyNumber);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleJumpPage("output");
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="page-jump-button"
                                    onClick={() => handleJumpPage("output")}
                                >
                                    이동
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    ); // return end
} // func end