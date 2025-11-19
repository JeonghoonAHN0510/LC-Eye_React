import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import ProjectListTable from "../../components/project/ProjectListTable.jsx";
import { setSelectedProject } from "../../store/projectSlice.jsx";
import "../../../assets/css/projectLeftSessionBox.css";

export default function ProjectLeftSection(props) {
    const dispatch = useDispatch();

    // 프로젝트 목록 상태
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        // 컴포넌트가 마운트될 때 프로젝트 목록 조회
        readAllProject();
    }, []);

    // 전체 프로젝트 목록 조회
    const readAllProject = async () => {
        try {
            const r = await axios.get("http://localhost:8080/api/project/all", {
                withCredentials: true,
            });
            const d = Array.isArray(r.data) ? r.data : [];
            setProjects(d);
        } catch (e) {
            console.error("[readAllProject error]", e);
        }
    }; // func end

    // ProjectListTable 컬럼 정의
    const columns = [
        { id: "pjno", title: "No", width: 60 },
        { id: "pjname", title: "프로젝트명", width: 260 },
        { id: "pjdesc", title: "프로젝트 설명", width: 300 },
        { id: "mname", title: "작성자", width: 120 },
        { id: "createdate", title: "생성일", width: 160 },
    ];

    // 행 클릭 시 해당 pjno로 상세 조회 후 store에 저장
    const handleRowClick = async (row) => {
        const pjno = row?.pjno;
        if (!pjno) return;

        try {
            const r = await axios.get(`http://localhost:8080/api/project?pjno=${pjno}`, {
                withCredentials: true,
            });
            dispatch(setSelectedProject(r.data));
        } catch (e) {
            console.error("[readProject error]", e);
        }
    };

    return (
        <>
            <div className="projectLeftSessionBox">
                <h2>프로젝트 목록</h2>
                <div>
                    <ProjectListTable
                        columns={columns}
                        data={projects}
                        rememberKey="ProjectListTable"
                        onRowClick={handleRowClick}
                    />
                </div>
            </div>
        </>
    ); // return end
} // func end
