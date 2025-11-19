import lceye from '../../../assets/img/LC-Eye.svg';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import axios from 'axios';
import { useState } from 'react';

const axiosOption = {withCredentials: true};

export default function LoingRightSection(props) {
    //======================= useState =======================
    const [idInput, setIdInput] = useState('');
    const [pwdInput, setPwdInput] = useState('');

    const login = async () => {
        if (!idInput || !pwdInput) return;
        try {
            const obj = {
                mid: idInput,
                mpwd: pwdInput
            } // obj end
            const response = await axios.post("http://localhost:8080/api/member/login", obj, axiosOption);
            const data = await response.data;
            if (data != null) location.href="/project"
        } catch (error) {
            console.log(error);
        } // try-catch end
    } // func end

    const handelIdChange = (e) => {
        const input = e.target.value;
        if (input.length <= 18) {
            setIdInput(input);
        } // if end
    } // func end

    const handlePwdChange = (e) => {
        const input = e.target.value;
        if (input.length <= 18) {
            setPwdInput(input);
        } // if end
    } // func end

    const enterKeyEvent = () => {
        if (window.event.keyCode == 13) login();
    } // func end

    return (
        <>
            <div className="rightSection">
                <div>
                    <img src={lceye} alt="lceye 이미지" />
                </div>
                <div className='inputBox'>
                    <Input
                        className='loginInput'
                        value={idInput}
                        onChange={handelIdChange}
                        onKeyUp={enterKeyEvent}
                        placeholder="아이디"
                        required
                    />
                    <Input
                        className='loginInput'
                        type='password'
                        value={pwdInput}
                        onChange={handlePwdChange}
                        onKeyUp={enterKeyEvent}
                        placeholder="비밀번호"
                        required
                    />
                    <Button type="submit" onClick={login}>로그인</Button>

                </div>
            </div>
        </>
    ) // return end
} // func end