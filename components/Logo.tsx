import Svg, { Path, Rect } from "react-native-svg";

type LogoProps = {
  size?: number;
};

export default function Logo({ size = 60 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Rect x="0" y="0" width="400" height="400" rx="90" fill="#4CAF50" />
      <Rect x="104" y="168" width="10" height="64" rx="5" fill="#FFFFFF" />
      <Rect x="286" y="168" width="10" height="64" rx="5" fill="#FFFFFF" />
      <Rect x="118" y="155" width="38" height="90" rx="12" fill="#FFFFFF" />
      <Rect x="244" y="155" width="38" height="90" rx="12" fill="#FFFFFF" />
      <Rect
        x="130"
        y="163"
        width="14"
        height="74"
        rx="6"
        fill="#3B6D11"
        opacity="0.18"
      />
      <Rect
        x="256"
        y="163"
        width="14"
        height="74"
        rx="6"
        fill="#3B6D11"
        opacity="0.18"
      />
      <Rect x="150" y="190" width="100" height="20" rx="10" fill="#FFFFFF" />
      <Path
        d="M200,196 Q160,178 148,140 Q188,150 200,196 Z"
        fill="#FFFFFF"
        opacity="0.85"
      />
      <Path
        d="M200,196 Q168,180 158,150"
        fill="none"
        stroke="#3B6D11"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <Path d="M200,190 Q178,140 225,98 Q248,148 200,190 Z" fill="#FFFFFF" />
      <Path
        d="M200,190 Q205,145 220,102"
        fill="none"
        stroke="#4CAF50"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </Svg>
  );
}
