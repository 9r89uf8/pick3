import React from 'react';
import { ListItem, Card, CardContent, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
const DrawList = ({ draws }) => {
    return (
        <>
            {draws && draws.length > 0 && draws.slice(0, 60).map((item, index) => (
                <ListItem key={index}>
                    <Card sx={{ minWidth: 275, textAlign: 'center', color: '#ffffff',
                        background: item.passCondition ? 'rgba(5,255,28,0.1)' : 'rgba(16,16,16,0.8)', // semi-transparent white
                        backdropFilter: 'blur(10px)', // apply blur
                        borderRadius: 4, // rounded corners
                        border: `1px solid ${alpha('#ffffff', 0.2)}` }}>
                        <CardContent>
                            <Typography variant="h5">
                                {item.currentDraw}
                            </Typography>
                            <Typography variant="body1">
                                {item.time}
                            </Typography>
                            {/*<Typography variant="body1">*/}
                            {/*    {item.fireball}*/}
                            {/*</Typography>*/}
                            <Typography variant="body1">
                                {item.drawDate}
                            </Typography>
                        </CardContent>
                    </Card>
                </ListItem>
            ))}
        </>
    );
};

export default DrawList;
