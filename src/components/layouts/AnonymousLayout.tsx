import React from 'react';
import { Outlet } from 'react-router-dom';
import IphoneDangCam from '../PhoneAgent/IphoneDangCam';

// layout của màn Thu ngân (/ban-hang)
const AnonymousLayout: React.FC = () => {
    return (
        <>
            <Outlet />
            {/* iPhone đang cắm USB (qua PhoneAgent) - góc dưới bên trái */}
            <IphoneDangCam />
        </>
    );
};

export default AnonymousLayout;
