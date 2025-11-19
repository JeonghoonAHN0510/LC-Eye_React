import "../../../assets/css/projectBasicInfo.css";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Textarea from "@mui/joy/Textarea";
import Input from "@mui/joy/Input";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

export default function ProjectBasicInfo(props) {
    const selectedProject = useSelector((state) => state.project?.selectedProject);

    // 폼에서 수정 가능한 값들(프로젝트명, 설명, 생산량, 단위)
    const [form, setForm] = useState({
        pjname: "",
        pjdesc: "",
        pjamount: "",
        uno: null,
    });

     const [units, setUnits] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedUnitUno, setSelectedUnitUno] = useState(null);

    // 선택된 프로젝트가 바뀌면 폼 값 초기화
    useEffect(() => {
        if (!selectedProject) {
            setForm({
                pjname: "",
                pjdesc: "",
                pjamount: "",
                uno: null,
            });
            return;
        }

        setForm({
            pjname: selectedProject.pjname ?? "",
            pjdesc: selectedProject.pjdesc ?? "",
            pjamount: selectedProject.pjamount ?? "",
            uno: selectedProject.uno ?? null,
        });
    }, [selectedProject]);

     // 단위 목록 조회
    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const res = await axios.get("http://localhost:8080/api/units", {
                    withCredentials: true,
                });
                const data = Array.isArray(res.data) ? res.data : [];
                setUnits(data);
            } catch (e) {
                console.error("[/api/units error]", e);
            }
        };
        fetchUnits();
    }, []);

    // 단위 그룹 목록 (중복 ugno 제거)
    const unitGroups = useMemo(() => {
        const map = new Map();
        units.forEach((u) => {
            if (!map.has(u.ugno)) map.set(u.ugno, u.ugname);
        });
        return Array.from(map, ([ugno, ugname]) => ({ ugno, ugname }));
    }, [units]);

    // 선택된 그룹에 해당하는 단위들
    const filteredUnits = useMemo(
        () => units.filter((u) => u.ugno === selectedGroup),
        [units, selectedGroup]
    );

    // 선택된 프로젝트 + 단위 목록이 준비되면 단위 선택 상태 동기화
    useEffect(() => {
        if (!selectedProject || !units.length || !selectedProject.uno) {
            setSelectedGroup(null);
            setSelectedUnitUno(null);
            return;
        }

        const unit = units.find((u) => u.uno === selectedProject.uno);
        if (unit) {
            setSelectedGroup(unit.ugno);
            setSelectedUnitUno(unit.uno);
            setForm((prev) => ({
                ...prev,
                uno: unit.uno,
            }));
        }
    }, [selectedProject, units]);

    const formatDate = (value) => {
        if (!value) return "";
        if (typeof value === "string") {
            return value.slice(0, 10);
        }
        return "";
    };

    // 이후 저장 API에 사용할 수 있도록 현재 폼 데이터를 모아서 처리 (★★)
    const handleSave = () => {
        const payload = {
            ...form,
            pjno: selectedProject?.pjno ?? null,
        };
        console.log("project basic info to save:", payload);
    };


    return (
        <>
            <div>
                <div className="headButton">
                    <Button variant="outlined" onClick={handleSave}>
                        저장
                    </Button>
                    <Button variant="outlined">초기화</Button>
                </div>
                <FormControl className="bottomMargin">
                    <FormLabel>프로젝트 명</FormLabel>
                    <Input
                        value={form.pjname}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                pjname: e.target.value,
                            }))
                        }
                    />
                </FormControl>
                <FormControl className="bottomMargin">
                    <FormLabel>프로젝트 설명</FormLabel>
                    <Textarea
                        minRows={3}
                        maxRows={5}
                        value={form.pjdesc}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                pjdesc: e.target.value,
                            }))
                        }
                    />
                </FormControl>
                <FormControl className="bottomMargin">
                    <FormLabel>작성자</FormLabel>
                    <Input value={selectedProject?.mname || ""} readOnly />
                </FormControl>
                <FormControl className="bottomMargin">
                    <FormLabel type="number">제품 생산량</FormLabel>
                    <Input
                        type="number"
                        value={form.pjamount}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                pjamount: e.target.value,
                            }))
                        }
                    />
                </FormControl>
                <div className="unitSelectArea bottomMargin">
                    <FormControl>
                        <FormLabel>단위 그룹</FormLabel>
                        <Select
                            placeholder="단위 그룹 선택"
                            value={selectedGroup}
                            onChange={(event, newValue) => {
                                setSelectedGroup(newValue);
                                setSelectedUnitUno(null);
                                setForm((prev) => ({
                                    ...prev,
                                    uno: null,
                                }));
                            }}
                        >
                            {unitGroups.map((g) => (
                                <Option key={g.ugno} value={g.ugno}>
                                    {g.ugname}
                                </Option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>단위</FormLabel>
                        <Select
                            placeholder="단위 선택"
                            value={selectedUnitUno}
                            onChange={(event, newValue) => {
                                setSelectedUnitUno(newValue);
                                setForm((prev) => ({
                                    ...prev,
                                    uno: newValue,
                                }));
                            }}
                            disabled={!selectedGroup}
                        >
                            {filteredUnits.map((u) => (
                                <Option key={u.uno} value={u.uno}>
                                    {u.unit}
                                </Option>
                            ))}
                        </Select>
                    </FormControl>
                </div>
                <div className="unitSelectArea bottomMargin">
                    <FormControl>
                        <FormLabel>등록일</FormLabel>
                        <Input
                            type="date"
                            readOnly
                            value={formatDate(selectedProject?.createdate)}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>수정일</FormLabel>
                        <Input
                            type="date"
                            readOnly
                            value={formatDate(selectedProject?.updatedate)}
                        />
                    </FormControl>
                </div>
            </div>
        </>
    );
}