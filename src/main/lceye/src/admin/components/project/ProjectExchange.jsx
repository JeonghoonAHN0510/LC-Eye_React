import Table from '@mui/joy/Table';
import Checkbox from '@mui/joy/Checkbox';
import { useState } from "react";
import axios from "axios";
import Modal from '@mui/joy/Modal'; // Joy UI Modal 예시
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import { useLocation } from "react-router-dom";
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import {useSelector} from 'react-redux';

export default function ProjectExchange(props){
    // 프로젝트 번호 상태
    const selectedProjectInfo = useSelector((state) => state.project.selectedProject);

    // 쿼리 파라미터 가져오기
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const pjno = params.get("pjno");

    // 행 데이터
    const [inputRows, setInputRows] = useState([{ id : 1 , pjename : "" , pjeamount : "" , uname : "", pname : "" , isInput : true}])
    const [outputRows, setOutputRows] = useState([{ id : 1 , pjename : "" , pjeamount : "" , uname : "", pname : "" , isInput : false }])

    // 매칭 데이터, 모달 상태
    const [openModal, setOpenModal] = useState(false);
    const [matchData, setMatchData] = useState({});
    const [checkedItems, setCheckedItems] = useState({});
    const [loading, setLoading] = useState(false); // 매칭 상태

    // 투입물 체크박스 선택 상태
    const [inputCheckedList, setInputCheckedList] = useState([]);
    const inputChecked = inputRows.length > 0 && inputCheckedList.length === inputRows.length;

    // 산출물 체크박스 선택 상태
    const [outputCheckedList, setOutputCheckedList] = useState([]);
    const outputChecked = outputRows.length > 0 && outputCheckedList.length === outputRows.length;

    // 투입물 전체 선택
    const handleCheckAllInput = (checked) => {
        if (checked) {
            setInputCheckedList(inputRows.map(input => input.id)); // 모든 id 선택
        } else {
            setInputCheckedList([]);
        }
    };

    // 산출물 전체 선택
    const handleCheckAllOutput = (checked) => {
        if (checked) {
            setOutputCheckedList(outputRows.map(output => output.id));
        }else {
            setOutputCheckedList([]);
        }// if end
    };

    // 투입물 개별 선택
    const handleCheckInput = (id) => {
        if (inputCheckedList.includes(id)) {
            setInputCheckedList(inputCheckedList.filter(item => item !== id));
        } else {
            setInputCheckedList([...inputCheckedList, id]);
        }
    };

    // 산출물 개별 선택
    const handleCheckOutput = (id) => {
        if(outputCheckedList.includes(id)){
            setOutputCheckedList(outputCheckedList.filter(item => item !== id));
        }else{
            setOutputCheckedList([...outputCheckedList, id]);
        }//if end
    };

    // 투입물 행 추가
    const addInputRow = () => {
        const newId = inputRows.length > 0 ? Math.max(...inputRows.map((r) => r.id)) + 1 : 1;
        setInputRows([...inputRows, { id: newId, pjename: "", pjeamount : "" , uname : "", pname : "" , isInput : true }]);
    };

    // 산출물 행 추가
    const addOutputRow = () => {
        const newId = outputRows.length > 0 ? Math.max(...outputRows.map((r) => r.id)) + 1 : 1;
        setOutputRows([...outputRows, { id: newId, pjename: "", pjeamount : "" , uname : "", pname : "" , isInput : false }])
    };

    // 투입물 td 입력값 변경
    const inputHandleChange = (id, field, value) => {
        setInputRows(inputRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    // 산출물 td 입력값 변경
    const outputHandleChange = (id, field, value) => {
        setOutputRows(outputRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    // 전체 매칭
    const matchAllIO = async () => {
        setLoading(true);

        const allPjenames = [...inputRows , ...outputRows].map(row => row.pjename);

        if (allPjenames.length === 0 || allPjenames.includes("")) {
            alert("매칭할 투입물·산출물을 입력해주세요.");
            setLoading(false);
            return;
        }// if end

        await matchIO(allPjenames);
    }// f end

    // 선택 매칭
    const matchSelectedIO = async () => {
        setLoading(true);

        // 선택된 ID 기반으로 행 필터 
        const selectedInputs = inputRows.filter(r => inputCheckedList.includes(r.id));
        const selectedOutputs = outputRows.filter(r => outputCheckedList.includes(r.id));

        const selected = [...selectedInputs, ...selectedOutputs];

        if (selected.length === 0) {
            alert("선택된 항목이 없습니다.");
            setLoading(false);
            return;
        }// if end

        const pjenames = selected.map(s => s.pjename);

        if (pjenames.includes("")) {
            alert("선택된 항목 중 이름이 비어 있습니다.");
            setLoading(false);
            return;
        }// if end

        await matchIO(pjenames);
    }// f end

    // 공통 매칭 요청
    const matchIO = async (pjenames) => {
        try {
            const response = await axios.post(
                "http://localhost:8081/api/inout/auto",
                pjenames,
                { withCredentials: true }
            );

            const data = response.data;

            if (data && typeof data === "object" && !Array.isArray(data)) {
                const formattedData = Object.entries(data).map(([key, value]) => ({ key, value }));
                setMatchData(formattedData);
                setCheckedItems({});
                setOpenModal(true);
            } else if (Array.isArray(data)) {
                setMatchData(data);
            } else {
                setMatchData([]);
            }// if end
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }// try end
    }// f end

    // 모달 체크/해제 함수
    const handleCheckValue = (key, value) => {
        setCheckedItems(prev => ({
            ...prev,
            [key]: value    
        }));
    };


    // 선택한 프로세스 행에 추가
    const handleSaveMatch = () => {
        // 각 키마다 체크한 값 배열 가져오기
        Object.entries(checkedItems).forEach(([key, value]) => {
            setInputRows(prev =>
                prev.map(row =>
                    row.pjename === key ? { ...row, pname: value } : row
                )
            );
            setOutputRows(prev =>
                prev.map(row =>
                    row.pjename === key ? { ...row, pname: value } : row
                )
            );
        });
        setOpenModal(false);
    };

    // 초기화
    const clearIOInfo = async () => {
        const pjno = selectedProjectInfo.pjno;
        try{
            const response = await axios.delete(`http://localhost:8081/api/inout?pjno=${pjno}`,  { withCredentials: true });
            const data = response.data;
            if(data){
                alert("초기화 되었습니다.");
            }else{
                alert("초기화에 실패하였습니다.");
            }// if end
        }catch(e){
            console.log(e);
        }// try end
    }// f end

    // 투입물 선택삭제
    const deleteInputRows = () => {
        if(inputCheckedList.length === 0){
            alert("삭제할 행을 선택해주세요.");
            return
        }// if end
        setInputRows(inputRows.filter(row => !inputCheckedList.includes(row.id)));
        setInputCheckedList([]); // 삭제후 체크박스 초기화
    }// f end

    // 산출물 선택삭제
    const deleteOutputRows = () => {
        if(outputCheckedList.length === 0){
            alert("삭제할 행을 선택해주세요.");
            return
        }// if end
        setOutputRows(outputRows.filter(row => !outputCheckedList.includes(row.id)));
        setOutputCheckedList([]); // 삭제후 체크박스 초기화
    }//  f end

    // 투입물·산출물 선택삭제
    const handleDelete = () => {
        const hasInput = inputCheckedList.length > 0;
        const hasOutput = outputCheckedList.length > 0;

        if(!hasInput && !hasOutput){
            alert("삭제할 행을 선택해주세요.");
            return;
        }

        if(hasInput) deleteInputRows();
        if(hasOutput) deleteOutputRows();
    }// f end

    // 투입물·산출물 저장
    const saveIOInfo = async () => {
        const obj = {
            pjno : selectedProjectInfo ,
            exchanges : [ ...inputRows , ...outputRows]
        };
        try{
            const response = await axios.post("http://localhost:8081/api/inout",obj ,  { withCredentials: true });
            const data = response.data;
            console.log(data);
            if(data){
                alert('저장 성공');
            }else{
                alert('저장 실패');
            }// if end
        }catch(e){
            console.log(e);
        }// try end
    }// f end

    return(
        <>
        <Modal
            open={openModal}
            onClose={() => setOpenModal(false)}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
            >
            <Sheet
                sx={{
                padding: 2,
                width: 450,
                maxHeight: "70vh", 
                overflowY: "auto",  
                border: "2px solid #334080", 
                borderRadius: 2,
                backgroundColor: "#fff",
                boxShadow: "0px 4px 16px rgba(0,0,0,0.2)",
                }}
                >
                <Typography level="h6" sx={{ marginBottom: 2, textAlign: "center" }}>
                    매칭 결과
                </Typography>
                {Array.isArray(matchData) && matchData.map(item => (
                    <Box
                        key={item.key}
                        sx={{
                        borderBottom: "1px solid #ccc", // 키 단위 구분선
                        marginBottom: 2,
                        paddingBottom: 1
                        }}
                    >
                        <Typography level="body1" sx={{ fontWeight: "bold" }}>{item.key}</Typography>

                        <Box
                        sx={{
                            marginTop: 1,
                            maxHeight: item.value.length > 3 ? 100 : "auto", // 값이 3개 이상이면 스크롤
                            overflowY: item.value.length > 3 ? "auto" : "visible",
                            border: item.value.length > 3 ? "1px solid #ddd" : "none",
                            padding: 1,
                            borderRadius: 1
                        }}
                        >
                        {item.value.map((val,index) => (
                            <Box key={index} sx={{ display: "flex", alignItems: "center", marginBottom: 0.5 }}>
                            <Checkbox
                                checked={checkedItems[item.key] === val}
                                onChange={() => handleCheckValue(item.key, val)}
                            />
                            <Typography level="body2" sx={{ marginLeft: 1 }}>{val}</Typography>
                            </Box>
                        ))}
                        </Box>
                    </Box>
                    ))}

                    <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <Button variant="solid" color="primary" onClick={handleSaveMatch}>
                        저장
                    </Button>
                    <Button variant="outlined" color="neutral" onClick={() => setOpenModal(false)}>
                        닫기
                    </Button>
                    </Box>
                </Sheet>
        </Modal>
        <div style={{alignItems: "center" , justifyContent: "end" , display: "flex"}}>
            <button
                style={{ color: "white", backgroundColor: "rgb(17 51 125)", marginLeft: "10px" }}
                onClick={matchSelectedIO}
                disabled={loading} 
            >
                {loading ? "매칭중..." : "선택 매칭"}
            </button>
            <button
                style={{ color: "white", backgroundColor: "rgb(17 51 125)", marginLeft: "10px" }}
                onClick={matchAllIO}
                disabled={loading} 
            >
                {loading ? "매칭중..." : "전체 매칭"}
            </button>
            <button 
            style={{ color: "white", backgroundColor: "rgb(17 51 125)" , marginLeft: "10px"}}
            onClick={ saveIOInfo }>
                저장
            </button>
            <button style={{ color: "white", backgroundColor: "rgb(17 51 125)" , marginLeft: "10px"}}>
                계산
            </button>
            <button 
            style={{ color: "white", backgroundColor: "rgb(17 51 125)" , marginLeft: "10px"}}
            onClick={ handleDelete }>
                삭제
            </button>
            <button 
            style={{ color: "white", backgroundColor: "rgb(17 51 125)" , marginLeft: "10px"}}
            onClick={clearIOInfo}>
                초기화
            </button>
        </div>
        <div style={{display: "flex" , justifyContent: "space-between" , alignItems: "center"}}>
            <h3>투입물</h3>
            <button style={{ color: "white", backgroundColor: "rgb(17 51 125)" , width: "70px" , height: "30px"}}
            onClick={addInputRow}>
                행 추가
            </button>
        </div>
        <Table
         aria-label="basic table"
         sx={{
                borderCollapse: "collapse", // 테두리 겹치지 않게
                "& th, & td": {
                border: "1px solid #ccc", // 연한 회색으로 구분선
                padding: "8px",
                textAlign: "center",       
                verticalAlign: "middle",
                },
                "& thead th": {
                backgroundColor: "#666",
                color: "white",
                fontWeight: "bold",
                },
                "& tbody tr:hover": {
                backgroundColor: "#f5f5f5", // 마우스 오버 시 하이라이트
                },
            }}
        >
            <thead>
                <tr>
                <th>
                    <Checkbox
                    checked={inputChecked}
                    indeterminate={!inputChecked && inputCheckedList.length > 0}
                    onChange={(e) => handleCheckAllInput(e.target.checked)}
                    />
                </th>
                <th style={{ width: "20%" }}>No</th>
                <th>투입물 명</th>
                <th>투입량</th>
                <th>단위</th>
                <th>연결 데이터</th>
                </tr>
            </thead>

            <tbody>
                {inputRows.map((input,index) => (
                <tr key={input.id}>
                    <td>
                    <Checkbox
                        checked={inputCheckedList.includes(input.id)}
                        onChange={() => handleCheckInput(input.id)}
                    />
                    </td>
                    <td>{index + 1}</td>
                    <td>
                        <input
                        type="text"
                        value={input.pjename}
                        onChange={(e) => inputHandleChange(input.id, "pjename", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                    <td>
                        <input
                        type="number"
                        value={input.pjeamount}
                        onChange={(e) => inputHandleChange(input.id, "pjeamount", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                    <td>
                        <input
                        type="text"
                        value={input.uname}
                        onChange={(e) => inputHandleChange(input.id, "uname", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                    <td>
                        <input
                        type="text"
                        value={input.pname}
                        onChange={(e) => inputHandleChange(input.id, "pname", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                </tr>
                ))}
            </tbody>
        </Table>
        <div
            style={{
            width: "100%",
            textAlign: "center",
            borderBottom: "1px solid #aaa",
            lineHeight: "0.1em",
            margin: "10px 0 20px",
            paddingTop: "20px"
        }}>            
        </div>
        <hr/>
        <div style={{display: "flex" , justifyContent: "space-between" , alignItems: "center"}}>
            <h3>산출물</h3>
            <button style={{ color: "white", backgroundColor: "rgb(17 51 125)" , width: "70px" , height: "30px"}}
            onClick={addOutputRow}>
                행 추가
            </button>
        </div>
        <Table
         aria-label="basic table"
         sx={{
                borderCollapse: "collapse", // 테두리 겹치지 않게
                "& th, & td": {
                border: "1px solid #ccc", // 연한 회색으로 구분선
                padding: "8px",
                textAlign: "center",       
                verticalAlign: "middle",
                },
                "& thead th": {
                backgroundColor: "#666",
                color: "white",
                fontWeight: "bold",
                },
                "& tbody tr:hover": {
                backgroundColor: "#f5f5f5", // 마우스 오버 시 하이라이트
                },
            }}
        >
            <thead>
                <tr>
                <th>
                    <Checkbox
                    checked={outputChecked}
                    indeterminate={!outputChecked && outputCheckedList.length > 0}
                    onChange={(e) => handleCheckAllOutput(e.target.checked)}
                    />
                </th>
                <th style={{ width: "20%" }}>No</th>
                <th>산출물 명</th>
                <th>산출량</th>
                <th>단위</th>
                <th>연결 데이터</th>
                </tr>
            </thead>

            <tbody>
                {outputRows.map((output,index) => (
                <tr key={output.id}>
                    <td>
                    <Checkbox
                        checked={outputCheckedList.includes(output.id)}
                        onChange={() => handleCheckOutput(output.id)}
                    />
                    </td>
                    <td>{index + 1}</td>
                    <td>
                        <input
                        type="text"
                        value={output.pjename}
                        onChange={(e) => outputHandleChange(output.id, "pjename", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                    <td>
                        <input
                        type="number"
                        value={output.pjeamount}
                        onChange={(e) => outputHandleChange(output.id, "pjeamount", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                    <td>
                        <input
                        type="text"
                        value={output.uname}
                        onChange={(e) => outputHandleChange(output.id, "uname", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                    <td>
                        <input
                        type="text"
                        value={output.pname}
                        onChange={(e) => outputHandleChange(output.id, "pname", e.target.value)}
                        style={{
                            border: "none",        
                            outline: "none",       
                            width: "100%",         
                            padding: "4px 0",   
                            textAlign: "center", 
                            backgroundColor: "transparent",
                        }}
                        />
                    </td>
                </tr>
                ))}
            </tbody>
        </Table>
        </>
    ) // return end
} // func end