import React, { useEffect, useRef, useMemo, useState, Fragment } from "react";
import styles from "./home.module.scss";
import { IconButton } from "./button";
import AddIcon from "../icons/add.svg";
import DeleteIcon from "../icons/delete.svg";
import DragIcon from "../icons/drag.svg";
import Locale from "../locales";
import { useAppConfig, useChatStore } from "../store";
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
} from "../constant";
import { useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showConfirm, Selector } from "./ui-lib";
import { Layout, Menu, Input, Button, Avatar } from 'antd';
import { AppstoreOutlined, EditOutlined, DeleteOutlined, PushpinOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import SubMenu from "antd/es/menu/SubMenu";
import { log } from "console";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

const { Sider } = Layout;

export function useHotKey() {
  const chatStore = useChatStore();
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

export function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);
  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBarContainer(props: {
  children: React.ReactNode;
  onDragStart: (e: MouseEvent) => void;
  shouldNarrow: boolean;
  className?: string;
}) {
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );
  const { children, className, onDragStart, shouldNarrow } = props;
  return (
    <div
      className={`${styles.sidebar} ${className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {children}
      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>
    </div>
  );
}

export function SideBarHeader(props: {
  logo?: React.ReactNode;
  children?: React.ReactNode;
  shouldNarrow: boolean;
}) {
  const { logo, children, shouldNarrow } = props;
  return (
    <Fragment>
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-logo"] + " no-dark"}>{logo}</div>
      </div>
      <div className={styles["header-buttons"]}>
        <Button type="primary" className={styles.createButton} onClick={() => {console.log("按钮1点击");}}>
          <PlusOutlined /> 创建应用
        </Button>
        <Button type="primary" className={styles.marketButton} onClick={() => {console.log("按钮2点击");}}>
          <RobotOutlined /> 创新广场
        </Button>
      </div>
      {children}
    </Fragment>
  );
}

export function SideBarBody(props: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
  const { onClick, children } = props;
  return (
    <div className={styles["sidebar-body"]} onClick={onClick}>
      {children}
    </div>
  );
}

export function SideBarTail(props: {
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  const { primaryAction, secondaryAction } = props;
  return (
    <div className={styles["sidebar-tail"]}>
      <div className={styles["sidebar-actions"]}>{primaryAction}</div>
      <div className={styles["sidebar-actions"]}>{secondaryAction}</div>
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  useHotKey();
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const [showPluginSelector, setShowPluginSelector] = useState(false);
  const navigate = useNavigate();
  const config = useAppConfig();
  const chatStore = useChatStore();

 
  const apps = [
    { name: 'iLink对话', icon: '/5.jpg' },
    { name: 'Slinda', icon: '/6.jpg' },
    { name: '文案助手', icon: '/7.jpg' },
    { name: '绘画大师', icon: '/8.jpg' },
  ];
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [activeApp, setActiveApp] = useState<string>(''); // 新增状态
  const [conversations, setConversations] = useState<string>('');
  const handleNewChatClick = (appName: string, appIcon: string) => {
      chatStore.newSession(appName,appIcon);
      navigate(Path.Chat);
      setSelectedApp(appName);
      setActiveApp(appName);
      setConversations('nihao');
  };
  return (
    <SideBarContainer
      onDragStart={onDragStart}
      shouldNarrow={shouldNarrow}
      {...props}
    >
      <SideBarHeader
        shouldNarrow={shouldNarrow}
      >

        <div className={styles["sidebar-header-bar"]}>
          <div className={styles["sidebar-action"]}>
          <Menu
        mode="inline"
        selectedKeys={[selectedApp]}
        style={{ borderRight: 0, fontSize: '1.1rem', padding: '0.625rem 0' }}
      >
        <SubMenu
          key="myApps"
          title="我的应用"
          icon={<img src='/3.jpg' alt='我的应用' style={{ width: '1.2rem', height: '1.2rem', marginRight: '0px' }} />}
          style={{ marginBottom: '0.9375rem', width: '200px'}}
        >
          {apps.map((app) => (
            <Menu.Item
              key={app.name}
              onClick={() => handleNewChatClick(app.name,app.icon)}
              style={{
                marginBottom: '12px',
                width: '200px',
                borderLeft: app.name === activeApp ? '4px solid #6286de' : '1px solid #cdc8c8',
                fontSize: '16px',
                marginLeft: '2.25rem',
                borderRadius: '0px',
                paddingLeft: '18px'
              }}
            >
              <Avatar src={app.icon} style={{ marginRight: '0.5rem' }} /> {app.name}
            </Menu.Item>
          ))}
        </SubMenu>
        <Menu.Item key="appMarket" style={{ marginBottom: '0.7rem' }} icon={<AppstoreOutlined style={{ fontSize: '1.25rem' }} />}>
          应用广场
        </Menu.Item>
      </Menu>
          </div>
        </div>
      </SideBarHeader>
      <div className={styles.section}>
        <div className={styles.searchHistory}>
          <Input placeholder="搜索历史记录" />
          <Button type="text" className={styles.clearButton} >
            <DeleteOutlined style={{color: '#bbbbbb',fontSize:'20px'}} />
          </Button>
        </div>
        <SideBarBody
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              navigate(Path.Home);

            }
          }}
        >
          <ChatList narrow={shouldNarrow} />
        </SideBarBody>
      </div>
    </SideBarContainer>
  );
}
