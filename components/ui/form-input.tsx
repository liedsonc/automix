import { createInput } from '@gluestack-ui/core/input/creator';
import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import {
	Pressable,
	TextInput,
	View,
	type PressableProps,
	type TextInputProps,
	type ViewProps,
} from 'react-native';

type WithClassName<P> = P & {
	className?: string;
};

const StyledInputRoot = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`flex-row items-center rounded-[24px] px-3 bg-[color:var(--primary-light)] ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledInputRoot.displayName = 'StyledInputRoot';

const StyledInputIcon = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`px-2 py-2 ${className}`} style={style} {...props} />
	),
);
StyledInputIcon.displayName = 'StyledInputIcon';

const StyledInputSlot = forwardRef<ComponentRef<typeof Pressable>, WithClassName<PressableProps>>(
	({ className = '', style, ...props }, ref) => (
		<Pressable ref={ref} className={className} style={style} {...props} />
	),
);
StyledInputSlot.displayName = 'StyledInputSlot';

const StyledTextInput = forwardRef<TextInput, WithClassName<TextInputProps>>(
	({ className = '', style, ...props }, ref) => (
		<TextInput
			ref={ref}
			className={`flex-1 px-2 py-4 text-lg text-[color:var(--black)] ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledTextInput.displayName = 'StyledTextInput';

const InputField = createInput({
	Root: StyledInputRoot,
	Icon: StyledInputIcon,
	Slot: StyledInputSlot,
	Input: StyledTextInput,
});

type FormInputProps = TextInputProps & {
	containerClassName?: string;
	inputClassName?: string;
	rightIcon?: ReactNode;
	onRightIconPress?: () => void;
};

export function FormInput({
	containerClassName = '',
	inputClassName = '',
	rightIcon,
	onRightIconPress,
	...inputProps
}: FormInputProps) {
	return (
		<InputField className={containerClassName}>
			<InputField.Input
				className={inputClassName}
				placeholderTextColor='#BDBDBD'
				{...inputProps}
			/>
			{rightIcon ? (
				<InputField.Icon>
					{onRightIconPress ? (
						<Pressable onPress={onRightIconPress} className='px-2 py-2'>
							{rightIcon}
						</Pressable>
					) : (
						<View className='px-2 py-2'>{rightIcon}</View>
					)}
				</InputField.Icon>
			) : null}
		</InputField>
	);
}
