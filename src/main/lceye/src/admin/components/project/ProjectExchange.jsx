import { useEffect, useState } from "react";
import axios from "axios";
import Checkbox from "@mui/joy/Checkbox";
import Modal from "@mui/joy/Modal";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useSelector } from "react-redux";
import ProjectListTable from "./ProjectListTable.jsx";
import useUnits from "../../hooks/useUnits";
import "../../../assets/css/ProjectExchange.css";
import { useLoading } from "../../contexts/LoadingContext.jsx";

export default function ProjectExchange(props) {
    const { pjno, isOpen, onCalcSuccess } = props;

    const selectedProject = useSelector(
        (state) => state.project?.selectedProject
    );
    const effectivePjno = pjno ?? selectedProject?.pjno ?? null;
    const { units } = useUnits();
    const { showLoading, hideLoading } = useLoading();

    const createInitialInputRows = () => [
        {
            id: 1,
            pjename: "",
            pjeamount: "",
            uname: "",
            uno: null,
            pname: "",
            isInput: true,
        },
    ];

    const createInitialOutputRows = () => [
        {
            id: 1,
            pjename: "",
            pjeamount: "",
            uname: "",
            uno: null,
            pname: "",
            isInput: false,
        },
    ];

    const [inputRows, setInputRows] = useState(createInitialInputRows);
    const [outputRows, setOutputRows] = useState(createInitialOutputRows);
    const [originalInputRows, setOriginalInputRows] = useState(
        createInitialInputRows
    );
    const [originalOutputRows, setOriginalOutputRows] = useState(
        createInitialOutputRows
    );

    const [openModal, setOpenModal] = useState(false);
    const [matchData, setMatchData] = useState([]);
    const [checkedItems, setCheckedItems] = useState({});
    const [loading, setLoading] = useState(false);

    const [inputCheckedList, setInputCheckedList] = useState([]);
    const [outputCheckedList, setOutputCheckedList] = useState([]);

    const inputChecked =
        inputRows.length > 0 && inputCheckedList.length === inputRows.length;
    const outputChecked =
        outputRows.length > 0 && outputCheckedList.length === outputRows.length;
    const unitOptions = units.map((u) => ({
        value: u.uno,
        label: u.unit,
        group: u.ugname,
    }));

    // Input 체크 핸들러 ==============================================================
    const handleCheckAllInput = (checked) => {
        if (checked) {
            setInputCheckedList(inputRows.map((row) => row.id));
        } else {
            setInputCheckedList([]);
        }
    };

    // Output 체크 핸들러 =============================================================
    const handleCheckAllOutput = (checked) => {
        if (checked) {
            setOutputCheckedList(outputRows.map((row) => row.id));
        } else {
            setOutputCheckedList([]);
        }
    };

    const handleCheckInput = (id) => {
        setInputCheckedList((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleCheckOutput = (id) => {
        setOutputCheckedList((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // 단위 적용 함수 =========================================================
    const applyUnitToRow = (isInput, rowId, newUno) => {
        const picked = units.find((u) => u.uno === newUno);
        const updater = (prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        uno: newUno,
                        uname: picked?.unit ?? "",
                    }
                    : row
            );
        (isInput ? setInputRows : setOutputRows)(updater);
    };

    // 행 추가 함수 =========================================================
    const addInputRow = () => {
        const newId =
            inputRows.length > 0
                ? Math.max(...inputRows.map((r) => r.id)) + 1
                : 1;
        setInputRows((prev) => [
            ...prev,
            {
                id: newId,
                pjename: "",
                pjeamount: "",
                uname: "",
                uno: null,
                pname: "",
                isInput: true,
            },
        ]);
    };

    const addOutputRow = () => {
        const newId =
            outputRows.length > 0
                ? Math.max(...outputRows.map((r) => r.id)) + 1
                : 1;
        setOutputRows((prev) => [
            ...prev,
            {
                id: newId,
                pjename: "",
                pjeamount: "",
                uname: "",
                uno: null,
                pname: "",
                isInput: false,
            },
        ]);
    };

    // 셀 값 변경 핸들러 =========================================================
    const inputHandleChange = (id, field, value) => {
        setInputRows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const outputHandleChange = (id, field, value) => {
        setOutputRows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // 매칭 함수 =========================================================
    const matchIO = async (pjenames) => {
        try {
            const response = await axios.post(
                "http://localhost:8081/api/inout/auto",
                pjenames,
                { withCredentials: true }
            );

            const data = response.data;

            if (data && typeof data === "object" && !Array.isArray(data)) {
                const formatted = Object.entries(data).map(([key, value]) => ({
                    key,
                    value,
                }));
                setMatchData(formatted);
                setCheckedItems({});
                setOpenModal(true);
            } else if (Array.isArray(data)) {
                setMatchData(data);
            } else {
                setMatchData([]);
            }
        } catch (e) {
            console.error("[matchIO error]", e);
        } finally {
            setLoading(false);
        }
    };

    // 전체 매칭 함수 =========================================================
    const matchAllIO = async () => {
        const loadingId = showLoading("최적 데이터베이스를 추천합니다.");
        setLoading(true);
        const allPjenames = [...inputRows, ...outputRows].map(
            (row) => row.pjename
        );

        if (allPjenames.length === 0 || allPjenames.includes("")) {
            alert("매칭할 투입물·산출물 이름을 모두 입력해 주세요.");
            setLoading(false);
            hideLoading(loadingId);
            return;
        }

        await matchIO(allPjenames);
        hideLoading(loadingId);
    };

    // 선택 매칭 함수 =========================================================
    const matchSelectedIO = async () => {
        const loadingId = showLoading("최적화 데이터베이스를 추천합니다.");
        setLoading(true);

        const selectedInputs = inputRows.filter((r) =>
            inputCheckedList.includes(r.id)
        );
        const selectedOutputs = outputRows.filter((r) =>
            outputCheckedList.includes(r.id)
        );
        const selected = [...selectedInputs, ...selectedOutputs];

        if (selected.length === 0) {
            alert("선택된 항목이 없습니다.");
            setLoading(false);
            hideLoading(loadingId);
            return;
        }

        const pjenames = selected.map((s) => s.pjename);
        if (pjenames.includes("")) {
            alert("선택된 항목 중 이름이 비어 있습니다.");
            setLoading(false);
            hideLoading(loadingId);
            return;
        }

        await matchIO(pjenames);
        hideLoading(loadingId);
    };

    // 매칭값 체크 핸들러 =====================================================
    const handleCheckValue = (key, value) => {
        setCheckedItems((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSaveMatch = () => {
        Object.entries(checkedItems).forEach(([key, value]) => {
            setInputRows((prev) =>
                prev.map((row) =>
                    row.pjename === key ? { ...row, pname: value } : row
                )
            );
            setOutputRows((prev) =>
                prev.map((row) =>
                    row.pjename === key ? { ...row, pname: value } : row
                )
            );
        });
        setOpenModal(false);
    };

    // 초기화 함수 =========================================================
    const clearIOInfo = async () => {
        if (!effectivePjno) {
            alert("프로젝트 번호가 없습니다.");
            return;
        }
        try {
            const response = await axios.delete(
                "http://localhost:8081/api/inout",
                {
                    params: { pjno: effectivePjno },
                    withCredentials: true,
                }
            );
            const data = response.data;
            if (data) {
                alert("초기화되었습니다.");
                setInputRows([]);
                setOutputRows([]);
                setInputCheckedList([]);
                setOutputCheckedList([]);
            } else {
                alert("초기화에 실패했습니다.");
            }
        } catch (e) {
            console.error("[clearIOInfo error]", e);
        }
    };

    // 삭제 함수 =========================================================
    const deleteInputRows = () => {
        if (inputCheckedList.length === 0) {
            alert("삭제할 항목을 선택해 주세요.");
            return;
        }
        setInputRows((prev) =>
            prev.filter((row) => !inputCheckedList.includes(row.id))
        );
        setInputCheckedList([]);
    };

    const deleteOutputRows = () => {
        if (outputCheckedList.length === 0) {
            alert("삭제할 항목을 선택해 주세요.");
            return;
        }
        setOutputRows((prev) =>
            prev.filter((row) => !outputCheckedList.includes(row.id))
        );
        setOutputCheckedList([]);
    };

    const handleDelete = () => {
        const hasInput = inputCheckedList.length > 0;
        const hasOutput = outputCheckedList.length > 0;

        if (!hasInput && !hasOutput) {
            alert("삭제할 항목을 선택해 주세요.");
            return;
        }

        if (hasInput) deleteInputRows();
        if (hasOutput) deleteOutputRows();
    };

    // 저장 함수 =========================================================
    const saveIOInfo = async () => {
        if (!effectivePjno) {
            alert("프로젝트 번호가 없습니다.");
            return;
        }

        const payload = {
            pjno: effectivePjno,
            exchanges: [...inputRows, ...outputRows],
        };

        try {
            const response = await axios.post(
                "http://localhost:8081/api/inout",
                payload,
                { withCredentials: true }
            );
            const data = response.data;
            if (data) {
                alert("저장되었습니다.");
                setOriginalInputRows(inputRows);
                setOriginalOutputRows(outputRows);
            } else {
                alert("저장에 실패하였습니다.");
            }
        } catch (e) {
            console.error("[saveIOInfo error]", e);
        }
    };

    // 변경 감지 함수 =========================================================
    const normalizeRows = (rows = []) =>
        rows.map((r) => ({
            id: r.id,
            pjename: r.pjename ?? "",
            pjeamount: String(r.pjeamount ?? ""),
            uname: r.uname ?? "",
            uno: r.uno ?? null,
            pname: r.pname ?? "",
            isInput: !!r.isInput,
        }));

    // 변경 여부 확인 함수 =========================================================
    const isDirty = () => {
        const currInput = JSON.stringify(normalizeRows(inputRows));
        const currOutput = JSON.stringify(normalizeRows(outputRows));
        const originalInput = JSON.stringify(normalizeRows(originalInputRows));
        const originalOutput = JSON.stringify(
            normalizeRows(originalOutputRows)
        );
        return currInput !== originalInput || currOutput !== originalOutput;
    };

    // 데이터 불러오기 =========================================================
    const readInOut = async (pjnoParam) => {
        if (!pjnoParam) return;
        const loadingId = showLoading("로딩중입니다.");
        try {
            const res = await axios.get("http://localhost:8081/api/inout", {
                params: { pjno: pjnoParam },
                withCredentials: true,
            });

            const inputList = Array.isArray(res?.data?.inputList)
                ? res.data.inputList
                : [];
            const outputList = Array.isArray(res?.data?.outputList)
                ? res.data.outputList
                : [];
            const unitNameToUno = new Map(
                units.map((u) => [u.unit, u.uno])
            );

            const mappedInput = inputList.map((item, index) => ({
                id: index + 1,
                pjename: item.pjename ?? "",
                pjeamount: item.pjeamount ?? "",
                uname: item.uname ?? "",
                uno: unitNameToUno.get(item.uname ?? "") ?? null,
                pname: item.pname ?? "",
                isInput: item.isInput ?? true,
            }));

            const mappedOutput = outputList.map((item, index) => ({
                id: index + 1,
                pjename: item.pjename ?? "",
                pjeamount: item.pjeamount ?? "",
                uname: item.uname ?? "",
                uno: unitNameToUno.get(item.uname ?? "") ?? null,
                pname: item.pname ?? "",
                isInput: item.isInput ?? false,
            }));

            setInputRows(mappedInput);
            setOutputRows(mappedOutput);
            setOriginalInputRows(mappedInput);
            setOriginalOutputRows(mappedOutput);
            setInputCheckedList([]);
            setOutputCheckedList([]);
        } catch (e) {
            console.error("[readInOut error]", e);
        } finally {
            hideLoading(loadingId);
        }
    };

    useEffect(() => {
        if (isOpen && effectivePjno) {
            readInOut(effectivePjno);
        }
    }, [isOpen, effectivePjno]);

    // 아코디언이 접힐 때 행들을 초기 상태로 되돌리기 =========================================================
    useEffect(() => {
        if (!isOpen) {
            setInputRows(createInitialInputRows());
            setOutputRows(createInitialOutputRows());
            setOriginalInputRows(createInitialInputRows());
            setOriginalOutputRows(createInitialOutputRows());
            setInputCheckedList([]);
            setOutputCheckedList([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!units.length) return;
        const map = new Map(units.map((u) => [u.unit, u.uno]));
        setInputRows((prev) =>
            prev.map((row) =>
                row.uno || !row.uname || !map.has(row.uname)
                    ? row
                    : { ...row, uno: map.get(row.uname) }
            )
        );
        setOutputRows((prev) =>
            prev.map((row) =>
                row.uno || !row.uname || !map.has(row.uname)
                    ? row
                    : { ...row, uno: map.get(row.uname) }
            )
        );
    }, [units]);

    // 계산 함수 =========================================================
    const calcLCI = async () => {
        if (!effectivePjno) {
            alert("프로젝트 번호가 없습니다.");
            return;
        }
        if (isDirty()) {
            alert("저장 후 다시 [계산]을 눌러주세요.");
            return;
        }
        const loadingId = showLoading("계산중입니다.");
        try {
            const res = await axios.get(
                `http://localhost:8081/api/lci/calc`,
                {
                    params: { pjno: effectivePjno },
                    withCredentials: true,
                }
            );
            const ok = res?.data === true;
            if (ok) {
                onCalcSuccess?.();
            } else {
                alert("계산에 실패하였습니다. [관리자에게 문의]");
            }
        } catch (e) {
            console.error("[calcLCI error]", e);
            alert("계산에 실패하였습니다. [관리자에게 문의]");
        } finally {
            hideLoading(loadingId);
        }
    };

    // 테이블 컬럼 및 데이터 ==================================================
    const inputColumns = [
        {
            id: "_select",
            title: (
                <Checkbox
                    checked={inputChecked}
                    indeterminate={
                        !inputChecked && inputCheckedList.length > 0
                    }
                    onChange={(e) => handleCheckAllInput(e.target.checked)}
                />
            ),
            width: 40,
        },
        { id: "no", title: "No", width: 30 },
        { id: "pjename", title: "투입물명", width: 100 },
        { id: "pjeamount", title: "투입량", width: 100 },
        { id: "uname", title: "단위", width: 100 },
        { id: "pname", title: "매칭 이름", width: 200 },
    ];

    const outputColumns = [
        {
            id: "_select",
            title: (
                <Checkbox
                    checked={outputChecked}
                    indeterminate={
                        !outputChecked && outputCheckedList.length > 0
                    }
                    onChange={(e) => handleCheckAllOutput(e.target.checked)}
                />
            ),
            width: 40,
        },
        { id: "no", title: "No", width: 30 },
        { id: "pjename", title: "산출물명", width: 100 },
        { id: "pjeamount", title: "산출량", width: 100 },
        { id: "uname", title: "단위", width: 100 },
        { id: "pname", title: "매칭 이름", width: 200 },
    ];

    // Input 테이블 데이터 ==================================================
    const inputTableData =
        inputRows.length > 0
            ? inputRows.map((row, index) => ({
                ...row,
                _select: (
                    <Checkbox
                        checked={inputCheckedList.includes(row.id)}
                        onChange={() => handleCheckInput(row.id)}
                    />
                ),
                no: index + 1,
                pjename: (
                    <input
                        type="text"
                        value={row.pjename}
                        onChange={(e) =>
                            inputHandleChange(
                                row.id,
                                "pjename",
                                e.target.value
                            )
                        }
                        className="projectExchangeCellInput"
                    />
                ),
                pjeamount: (
                    <input
                        type="number"
                        value={row.pjeamount}
                        onChange={(e) =>
                            inputHandleChange(
                                row.id,
                                "pjeamount",
                                e.target.value
                            )
                        }
                        className="projectExchangeCellInput"
                    />
                ),
                uname: (
                    <Select
                        placeholder={row.uname || "단위 선택"}
                        value={row.uno ?? null}
                        onChange={(_, newUno) =>
                            applyUnitToRow(true, row.id, newUno)
                        }
                        disabled={!unitOptions.length}
                        size="sm"
                    >
                        {unitOptions.map((u) => (
                            <Option key={u.value} value={u.value}>
                                {u.group ? `${u.group} / ${u.label}` : u.label}
                            </Option>
                        ))}
                    </Select>
                ),
                pname: (
                    <input
                        type="text"
                        value={row.pname}
                        onChange={(e) =>
                            inputHandleChange(
                                row.id,
                                "pname",
                                e.target.value
                            )
                        }
                        className="projectExchangeCellInput"
                    />
                ),
            }))
            : [{ __empty: true }];

    // Output 테이블 데이터 ==================================================
    const outputTableData =
        outputRows.length > 0
            ? outputRows.map((row, index) => ({
                ...row,
                _select: (
                    <Checkbox
                        checked={outputCheckedList.includes(row.id)}
                        onChange={() => handleCheckOutput(row.id)}
                    />
                ),
                no: index + 1,
                pjename: (
                    <input
                        type="text"
                        value={row.pjename}
                        onChange={(e) =>
                            outputHandleChange(
                                row.id,
                                "pjename",
                                e.target.value
                            )
                        }
                        className="projectExchangeCellInput"
                    />
                ),
                pjeamount: (
                    <input
                        type="number"
                        value={row.pjeamount}
                        onChange={(e) =>
                            outputHandleChange(
                                row.id,
                                "pjeamount",
                                e.target.value
                            )
                        }
                        className="projectExchangeCellInput"
                    />
                ),
                uname: (
                    <Select
                        placeholder={row.uname || "단위 선택"}
                        value={row.uno ?? null}
                        onChange={(_, newUno) =>
                            applyUnitToRow(false, row.id, newUno)
                        }
                        disabled={!unitOptions.length}
                        size="sm"
                    >
                        {unitOptions.map((u) => (
                            <Option key={u.value} value={u.value}>
                                {u.group ? `${u.group} / ${u.label}` : u.label}
                            </Option>
                        ))}
                    </Select>
                ),
                pname: (
                    <input
                        type="text"
                        value={row.pname}
                        onChange={(e) =>
                            outputHandleChange(
                                row.id,
                                "pname",
                                e.target.value
                            )
                        }
                        className="projectExchangeCellInput"
                    />
                ),
            }))
            : [{ __empty: true }];

    // return ==================================================================
    return (
        <>
            <Modal
                open={openModal}
                onClose={() => setOpenModal(false)}
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Sheet
                    sx={{
                        padding: 2,
                        width: "50%",
                        maxHeight: "50vh",
                        overflowY: "auto",
                        border: "2px solid #334080",
                        borderRadius: 2,
                        backgroundColor: "#fff",
                        boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.2)",
                    }}
                >
                    <Typography
                        level="h6"
                        sx={{ marginBottom: 2, textAlign: "center" }}
                    >
                        매칭 결과
                    </Typography>
                    {Array.isArray(matchData) &&
                        matchData.map((item) => (
                            <Box
                                key={item.key}
                                sx={{
                                    borderBottom: "1px solid #ccc",
                                    marginBottom: 2,
                                    paddingBottom: 1,
                                }}
                            >
                                <Typography
                                    level="body1"
                                    sx={{ fontWeight: "bold" }}
                                >
                                    {item.key}
                                </Typography>

                                <Box
                                    sx={{
                                        marginTop: 1,
                                        maxHeight:
                                            item.value.length > 3
                                                ? 100
                                                : "auto",
                                        overflowY:
                                            item.value.length > 3
                                                ? "auto"
                                                : "visible",
                                        border:
                                            item.value.length > 3
                                                ? "1px solid #ddd"
                                                : "none",
                                        padding: 1,
                                        borderRadius: 1,
                                    }}
                                >
                                    {item.value.map((val, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                marginBottom: 0.5,
                                            }}
                                            className="dividerLineForMatching"
                                        >
                                            <Checkbox
                                                checked={
                                                    checkedItems[item.key] ===
                                                    val
                                                }
                                                onChange={() =>
                                                    handleCheckValue(
                                                        item.key,
                                                        val
                                                    )
                                                }
                                            />
                                            <Typography
                                                level="body2"
                                                sx={{ marginLeft: 1 }}
                                            >
                                                {val}
                                            </Typography>
                                            <br />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))}

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 2,
                        }}
                    >
                        <Button
                            variant="solid"
                            color="primary"
                            onClick={handleSaveMatch}
                        >
                            적용
                        </Button>
                        <Button
                            variant="outlined"
                            color="neutral"
                            onClick={() => setOpenModal(false)}
                        >
                            닫기
                        </Button>
                    </Box>
                </Sheet>
            </Modal>
            <div className="projectExchangeToolbar">
                <Button variant="outlined"
                    onClick={matchSelectedIO}
                    disabled={loading}
                >
                    {loading ? "매칭 중..." : "선택 매칭"}
                </Button>
                <Button variant="outlined"
                    onClick={matchAllIO}
                    disabled={loading}
                >
                    {loading ? "매칭 중..." : "전체 매칭"}
                </Button>
                <Button variant="outlined"
                    onClick={saveIOInfo}
                >
                    저장
                </Button>
                <Button variant="outlined"
                    onClick={calcLCI}
                >
                    계산
                </Button>
                <Button variant="outlined"
                    onClick={handleDelete}
                >
                    삭제
                </Button>
                <Button variant="outlined"
                    onClick={clearIOInfo}
                >
                    초기화
                </Button>
            </div>
            <div className="projectExchangeTable">
                <div className="projectExchangeSectionHeader">
                    <div className="resultTitle">투입물</div>
                    <Button variant="outlined"
                        onClick={addInputRow}
                    >
                        행추가
                    </Button>
                </div>
                <ProjectListTable
                    columns={inputColumns}
                    data={inputTableData}
                    rememberKey="ProjectExchangeInputTable"
                    sortable={false}
                    stickyFirst={false}
                />
                <div className="divisionArea"></div>

                <div className="projectExchangeSectionHeader">
                    <div className="resultTitle">산출물</div>
                    <Button variant="outlined"
                        onClick={addOutputRow}
                    >
                        행추가
                    </Button>
                </div>
                <ProjectListTable
                    columns={outputColumns}
                    data={outputTableData}
                    rememberKey="ProjectExchangeOutputTable"
                    sortable={false}
                    stickyFirst={false}
                />
            </div>
        </>
    ); // return end
} // func end
