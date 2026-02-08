export default function ComingSoonBox({ title, text }) {
	return (
		<div
			style={{
				border: "1px solid rgba(255,255,255,0.14)",
				borderRadius: 14,
				padding: 14,
				background: "rgba(0,0,0,0.18)",
			}}
		>
			<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
				<svg width='44' height='44' viewBox='0 0 64 64' aria-hidden='true'>
					<defs>
						<linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
							<stop offset='0' stopColor='#7dd3fc' />
							<stop offset='1' stopColor='#a7f3d0' />
						</linearGradient>

						<linearGradient id='mountain1' x1='0' y1='0' x2='1' y2='1'>
							<stop offset='0' stopColor='#22c55e' />
							<stop offset='1' stopColor='#16a34a' />
						</linearGradient>

						<linearGradient id='mountain2' x1='0' y1='0' x2='1' y2='1'>
							<stop offset='0' stopColor='#60a5fa' />
							<stop offset='1' stopColor='#3b82f6' />
						</linearGradient>

						<filter
							id='softShadow'
							x='-20%'
							y='-20%'
							width='140%'
							height='140%'
						>
							<feDropShadow
								dx='0'
								dy='2'
								stdDeviation='2'
								floodOpacity='0.25'
							/>
						</filter>
					</defs>

					{/* background badge */}
					<circle
						cx='32'
						cy='32'
						r='28'
						fill='url(#sky)'
						opacity='0.9'
						filter='url(#softShadow)'
					/>

					{/* sun */}
					<circle cx='44' cy='22' r='6.5' fill='#fbbf24' opacity='0.95' />
					<circle cx='44' cy='22' r='10' fill='#fde68a' opacity='0.25' />

					{/* mountains */}
					<path
						d='M12 46 L26 28 L36 40 L44 30 L56 46 Z'
						fill='url(#mountain2)'
						opacity='0.95'
					/>
					<path
						d='M8 48 L22 34 L32 44 L40 36 L58 52 L8 52 Z'
						fill='url(#mountain1)'
						opacity='0.95'
					/>

					{/* ridge line */}
					<path
						d='M10 50c7-7 14-10 22-10s15 3 22 10'
						fill='none'
						stroke='rgba(255,255,255,0.75)'
						strokeWidth='2'
						strokeLinecap='round'
					/>

					{/* small flag */}
					<path
						d='M18 26v10'
						stroke='rgba(15,23,42,0.65)'
						strokeWidth='2'
						strokeLinecap='round'
					/>
					<path
						d='M18 26c5 0 6-3 10-3v6c-4 0-5 3-10 3z'
						fill='#ef4444'
						opacity='0.9'
					/>
				</svg>

				<div>
					<div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
					<div style={{ opacity: 0.85, lineHeight: 1.35 }}>{text}</div>
				</div>
			</div>
		</div>
	);
}
