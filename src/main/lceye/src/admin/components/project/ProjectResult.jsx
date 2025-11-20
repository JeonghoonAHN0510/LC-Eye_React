import { useEffect, useState } from "react";
import axios from "axios";
import "../../../assets/css/ProjectResult.css";
import { Table } from "@mui/material";
import { Select, Option } from "@mui/joy";

export default function ProjectResult(props) {
    const { pjno, isOpen } = props;

    const [lciInputData, setLciInputData] = useState([]);
    const [lciOutputData, setLciOutputData] = useState([]);

    // pjno 를 기반으로 파일 존재 여부를 확인, 파일이 존재하면 readLCI 호출 ================


    // pjno 를 매개변수로 LCI 조회 =========================================
    const readLCI = async (pjnoParam) => {
        if (!pjnoParam) return;
        try {
            const res = await axios.get("http://localhost:8081/api/lci", {
                params: { pjno: pjnoParam },
                withCredentials: true,
            });

            const results = Array.isArray(res?.data?.results)
                ? res.data.results
                : [];

            // isInput 값에 따라 Input/Output 리스트 분리
            const inputs = results.filter((item) => item.isInput === true);
            const outputs = results.filter((item) => item.isInput === false);

            setLciInputData(inputs);
            setLciOutputData(outputs);
        } catch (error) {
            console.error("[readLCI 실패]", error);
        }
    }; // func end

    // 아코디언이 열릴 때마다 pjno 기준으로 호출 ===========================
    useEffect(() => {
        if (isOpen && pjno) {
            readLCI(pjno);
        }
    }, [isOpen, pjno]);

    // return =======================================================
    return (
        <>
            <div className="projectResultTopBar">
                <div>조회 개 수</div>
                <div style={{ width : "10rem"}}>
                    <Select defaultValue="100" onChange={(value) => { }}>
                        <Option value="100">100개 씩</Option>
                        <Option value="150">150개 씩</Option>
                        <Option value="200">200개 씩</Option>
                    </Select>
                </div>
            </div>
            <div className="projectResultBox">

                <div className="inputResultBox">
                    <div className="resultTitle">Input</div>
                    <Table>
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>값</th>
                                <th>단위</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lciInputData && lciInputData.length > 0 ? (
                                lciInputData.map((item) => (
                                    <tr key={`${item.fuuid}-${item.uno}-in`}>
                                        <td>{item.fname}</td>
                                        <td>{item.amount}</td>
                                        <td>{item.uname}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3}>입력 데이터가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
                <div className="outputResultBox">
                    <div className="resultTitle">Output</div>
                    <Table>
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>값</th>
                                <th>단위</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lciOutputData && lciOutputData.length > 0 ? (
                                lciOutputData.map((item) => (
                                    <tr key={`${item.fuuid}-${item.uno}-out`}>
                                        <td>{item.fname}</td>
                                        <td>{item.amount}</td>
                                        <td>{item.uname}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3}>출력 데이터가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>
        </>
    ); // return end
} // func end

