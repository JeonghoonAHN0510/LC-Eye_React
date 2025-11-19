import { useDispatch, useSelector } from "react-redux"
import { Navigate, Outlet } from "react-router-dom";
import axios from 'axios';
import { useEffect } from "react";
import { checkingLogin } from "../store/adminSlice";
import '../../assets/css/login.css';

const axiosOption = {withCredentials: true};

export default function RoleRoute(props){
    //======================= useDispatch =======================
    const dispatch = useDispatch();
    //======================= useSelector =======================
    const { isLogin } = useSelector((state) => state.admin);
    console.log(isLogin);
    //======================= checkAuth =======================
    const checkAuth = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/member/getinfo", axiosOption);
            const data = await response.data;
            dispatch(checkingLogin(data));
        } catch (error) {
            dispatch(checkingLogin({
                ...isLogin,
                isAuth: false
            }))
        } // try-catch end
    } // func end
    //======================= useEffect - 최초 렌더링시 1회 실행 =======================
    useEffect(() => {
        checkAuth();
    }, []);
    // 1. 아직 권한 확인중이라면, 안내문구 출력
    if (isLogin.isAuth == null) return <div> 권한 확인 중입니다. </div>

    // 2. 만약 비로그인 상태라면, 메인페이지로 이동
    if (isLogin.isAuth == false) return <Navigate to="/"/>

    // 3. 
    if (!props.roles.includes(isLogin.role)) return <Navigate to="/"/>

    // 4. 만약 로그인 상태라면, 자식 컴포넌트 렌더링하기
    return(
        <>
            <Outlet/>
        </>
    ) // return end
} // func end