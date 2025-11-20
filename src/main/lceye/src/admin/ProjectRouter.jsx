import Header from './components/layout/Header.jsx';
import ProjectLeftSection from "./pages/project/ProjectLeftSection";
import ProjectRightSection from "./pages/project/ProjectRightSection";
import '../assets/css/project.css';
import SimpleSplitPane from './components/layout/SplitPaneResponsive.jsx';

export default function ProjectRouter(props) {
    return (
        <>
            <div className='header'>
                <Header />
            </div>
                <SimpleSplitPane
                    initLeftPct={45}              // 초기 좌측 폭(%)
                    minLeftPx={240}               // 좌측 최소(px)
                    minRightPx={320}              // 우측 최소(px)
                    left={<ProjectLeftSection />}        // 좌측 콘텐츠
                    right={<ProjectRightSection />}     // 우측 콘텐츠
                />
        </>
    ) // return end
} // func end