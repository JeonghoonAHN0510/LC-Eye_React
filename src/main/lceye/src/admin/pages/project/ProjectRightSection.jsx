import ProjectBasicInfo from "../../components/project/ProjectBasicInfo";
import ProjectExchange from "../../components/project/ProjectExchange.jsx";
import ProjectResult from "../../components/project/ProjectResult";
import Accordion from '@mui/joy/Accordion';
import AccordionDetails from '@mui/joy/AccordionDetails';
import AccordionGroup from '@mui/joy/AccordionGroup';
import AccordionSummary from '@mui/joy/AccordionSummary';

export default function ProjectRightSection(props) {
    return (
        <>
            <div className="projectRigthTop">
                <div className="projectNameBox">프로젝트명</div>
                <div>
                    <button>저장</button>
                </div>
            </div>
            <div className="projectRightBot">
                <AccordionGroup
                    size={"md"}
                    variant="outlined"
                    sx={{borderRadius: 'lg'}}
                    >
                    <Accordion defaultExpanded>
                        <AccordionSummary><div className="sectionName">프로젝트 기본정보</div></AccordionSummary>
                        <AccordionDetails>
                            <ProjectBasicInfo />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary><div className="sectionName">투입물 · 산출물 정보</div></AccordionSummary>
                        <AccordionDetails>
                            <ProjectExchange />
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary><div className="sectionName">LCI 결과</div></AccordionSummary>
                        <AccordionDetails>
                            <ProjectResult />
                        </AccordionDetails>
                    </Accordion>
                </AccordionGroup>
            </div>
        </>
    ) // return end
} // func end