import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import ProjectListTable from "../../components/project/ProjectListTable.jsx";
import { setSelectedProject } from "../../store/projectSlice.jsx";
import "../../../assets/css/projectLeftSessionBox.css";
import { useLoading } from "../../contexts/LoadingContext.jsx";

export default function ProjectLeftSection(props) {
    const dispatch = useDispatch();
    const projectListVersion = useSelector(
        (state) => state.project?.projectListVersion
    );
    const { showLoading, hideLoading } = useLoading();

    // 프로젝트 목록 상태 =====================================================
    const [projects, setProjects] = useState([]);

    // 리스트 표시용 날짜 포맷 (YYYY-MM-DD HH:MM) =============================
    const formatListDateTime = (value) => {
        if (!value) return "";
        if (typeof value === "string") {
            // "2025-11-19T10:55:10.984161" -> "2025-11-19 10:55"
            const base = value.slice(0, 16); // YYYY-MM-DDTHH:MM
            return base.replace("T", " "); // T를 공백으로 변환
        }
        return "";
    };

    // 전체 프로젝트 목록 조회 ================================================
    const readAllProject = async () => {
        try {
            const r = await axios.get("http://localhost:8081/api/project/all", {
                withCredentials: true,
            });
            const d = Array.isArray(r.data) ? r.data : [];
            setProjects(
                d.map((p) => ({
                    ...p,
                    createdate: formatListDateTime(p.createdate),
                }))
            );
        } catch (e) {
            console.error("[readAllProject error]", e);
        }
    }; // func end

    // 컴포넌트 마운트 & projectListVersion 변경 시 목록 재조회 ================
    useEffect(() => {
        readAllProject();
    }, [projectListVersion]);

    // ProjectListTable 컬럼 정의 ==============================================
    const columns = [
        { id: "pjno", title: "No", width: 60 },
        { id: "pjname", title: "프로젝트명", width: 100 },
        { id: "pjdesc", title: "프로젝트 설명", width: 100 },
        { id: "mname", title: "작성자", width: 100 },
        { id: "createdate", title: "작성일", width: 100 },
    ];

    // 행 클릭 시 해당 pjno 로 상세 조회 후 store 에 저장 ======================
    const handleRowClick = async (row) => {
        const pjno = row?.pjno;
        if (!pjno) return;

        const loadingId = showLoading("로딩중입니다.");
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        try {
            const [r] = await Promise.all([
                axios.get(`http://localhost:8081/api/project?pjno=${pjno}`, {
                    withCredentials: true,
                }),
                sleep(1000),
            ]);
            dispatch(setSelectedProject(r.data));
        } catch (e) {
            console.error("[readProject error]", e);
        } finally {
            hideLoading(loadingId);
        }
    };

    // return ==================================================================
    return (
        <>
            <div>
                <div className="projectListNameBox">프로젝트 목록</div>
                <div className="projectListBox">
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
