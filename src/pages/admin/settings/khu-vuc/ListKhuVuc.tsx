import { List, ListItem, ListItemText, Collapse, IconButton, Typography, Box } from '@mui/material';
import { ExpandLess, ExpandMore, Edit, LocationOn } from '@mui/icons-material';
import { useState } from 'react';
import { KhuVucDto } from '../../../../services/khu_vuc/dto';

const KhuVucList = ({
    data,
    onEdit,
    onSelectKhuVuc
}: {
    data: KhuVucDto[];
    onEdit: (isEdit: boolean, item: KhuVucDto) => void;
    onSelectKhuVuc: (id: string) => void;
}) => {
    const [open, setOpen] = useState<{ [key: string]: boolean }>({});
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const getRandomColor = (name: string | undefined, opacity = 0.8) => {
        if (!name) return `rgba(158, 158, 158, ${opacity})`;

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsla(${hue}, 70%, 50%, ${opacity})`;
    };

    const handleToggle = (id: string | undefined) => {
        if (!id) return;
        setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <List>
            {data.map((item) => {
                const hasChildren = Array.isArray(item.children) && item.children.length > 0;

                return (
                    <div
                        key={item.id}
                        onMouseEnter={() => setHoveredItem(item.id ?? '')}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{ position: 'relative' }}>
                        <ListItem onClick={() => handleToggle(item.id)}>
                            <ListItemText
                                //onClick={() => handleSelectKhuVuc(item.id)}
                                primary={
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                        onClick={() => onSelectKhuVuc(item.id ?? '')}
                                        sx={{ cursor: 'pointer' }} // 🔹 Biến con trỏ thành bàn tay khi hover
                                    >
                                        <LocationOn
                                            sx={{
                                                color: getRandomColor(
                                                    item.tenKhuVuc,
                                                    hoveredItem === item.id ? 1 : 0.6
                                                ),
                                                fontSize: 20,
                                                transition: 'opacity 0.3s ease'
                                            }}
                                        />
                                        <Typography fontWeight="bold">{item.tenKhuVuc}</Typography>
                                    </Box>
                                }
                            />
                            {hasChildren ? open[item.id ?? ''] ? <ExpandLess /> : <ExpandMore /> : null}
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(true, item);
                                }}
                                sx={{
                                    ml: 1,
                                    opacity: hoveredItem === item.id ? 1 : 0,
                                    transform: hoveredItem === item.id ? 'translateX(0)' : 'translateX(5px)',
                                    transition: 'opacity 0.3s ease, transform 0.3s ease'
                                }}>
                                <Edit />
                            </IconButton>
                        </ListItem>
                        {hasChildren && (
                            <Collapse in={open[item.id ?? '']} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding sx={{ paddingLeft: 2 }}>
                                    <KhuVucList
                                        data={item.children || []}
                                        onEdit={onEdit}
                                        onSelectKhuVuc={onSelectKhuVuc}
                                    />
                                </List>
                            </Collapse>
                        )}
                    </div>
                );
            })}
        </List>
    );
};

export default KhuVucList;
