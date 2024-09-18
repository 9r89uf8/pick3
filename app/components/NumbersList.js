import React from 'react';
import { ListItem, Card, CardContent, Typography } from '@mui/material';

const NumbersList = ({ numbers }) => {
    return (
        <>
            {numbers && numbers.length > 0 && numbers.slice(0, 40).map((item, index) => (
                <ListItem key={index}>
                    <div style={{display: "block"}}>
                        {/* Assuming item is an array, join it to display as a string */}
                        <Typography variant="h4" style={{color: 'white'}}>
                            {item} {/* Adjusted to handle array of numbers */}
                        </Typography>
                        {/* Example conditional rendering if each item had additional properties */}
                        {item.points && (
                            <>
                                <Typography variant="h6">
                                    Points: {item.points}
                                </Typography>
                                <Typography variant="h6">
                                    Sum: {item.sum}
                                </Typography>
                            </>
                        )}
                    </div>
                </ListItem>
            ))}
        </>
    );
};

export default NumbersList;
