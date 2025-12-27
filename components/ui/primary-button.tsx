import { createButton } from '@gluestack-ui/core/button/creator';
import { forwardRef, type ComponentRef } from 'react';
import {
	Pressable,
	Text,
	View,
	type PressableProps,
	type TextProps,
	type ViewProps,
} from 'react-native';

type WithClassName<P> = P & {
	className?: string;
};

const StyledButtonRoot = forwardRef<ComponentRef<typeof Pressable>, WithClassName<PressableProps>>(
	({ className = '', style, ...props }, ref) => (
		<Pressable
			ref={ref}
			className={`w-full rounded-[28px] py-4 items-center mb-4 bg-[color:var(--primary)] ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledButtonRoot.displayName = 'StyledButtonRoot';

const StyledButtonText = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--white)] font-semibold text-lg ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledButtonText.displayName = 'StyledButtonText';

const StyledButtonIcon = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={className} style={style} {...props} />
	),
);
StyledButtonIcon.displayName = 'StyledButtonIcon';

const StyledButtonSpinner = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={className} style={style} {...props} />
	),
);
StyledButtonSpinner.displayName = 'StyledButtonSpinner';

const StyledButtonGroup = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={className} style={style} {...props} />
	),
);
StyledButtonGroup.displayName = 'StyledButtonGroup';

const GluestackButton = createButton({
	Root: StyledButtonRoot,
	Text: StyledButtonText,
	Group: StyledButtonGroup,
	Spinner: StyledButtonSpinner,
	Icon: StyledButtonIcon,
});

type PrimaryButtonProps = PressableProps & {
	label: string;
	className?: string;
	textClassName?: string;
};

export function PrimaryButton({
	label,
	className = '',
	textClassName = '',
	...rest
}: PrimaryButtonProps) {
	return (
		<GluestackButton className={className} {...rest}>
			<GluestackButton.Text className={textClassName}>{label}</GluestackButton.Text>
		</GluestackButton>
	);
}
